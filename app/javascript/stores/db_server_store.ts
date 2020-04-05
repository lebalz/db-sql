import { observable, action, reaction, computed, IReactionDisposer } from 'mobx';
import { RootStore, Store } from './root_store';
import _ from 'lodash';
import {
  dbServers,
  updateDbServer,
  createDbServer,
  remove as removeApi,
  query as fetchQuery,
} from '../api/db_server';
import DbServer from '../models/DbServer';
import { TempDbServer } from '../models/TempDbServer';
import 'regenerator-runtime/runtime';
import { QuerySeparationGrammarLexer } from '../antlr/QuerySeparationGrammarLexer';
import { QuerySeparationGrammarParser } from '../antlr/QuerySeparationGrammarParser';
import { ANTLRInputStream, CommonTokenStream } from 'antlr4ts';
import { REST } from '../declarations/REST';
import { RequestState } from './session_store';

function identifyCommands(queryText: string) {
  const inputStream = new ANTLRInputStream(queryText);
  console.time('lexing');
  const lexer = new QuerySeparationGrammarLexer(inputStream);
  console.timeLog('lexing');
  const tokenStream = new CommonTokenStream(lexer);
  console.time('parse');
  const parser = new QuerySeparationGrammarParser(tokenStream);
  console.timeLog('parse');
  console.time('queryText');
  const { children } = parser.queriesText();
  console.timeLog('queryText');
  if (!children) {
    return [];
  }

  return children.map((child) => child.text).slice(0, -1);
}

enum LoadState {
  Loading,
  Error,
  Success,
  None,
}

class State {
  dbServers = observable<DbServer>([]);
  @observable activeDbServerId: string = '';

  @observable tempDbServer?: TempDbServer = undefined;

  @observable loadState: LoadState = LoadState.None;
  @observable saveState: RequestState = RequestState.None;

  @observable queryState: RequestState = RequestState.None;
}

class DbServerStore implements Store {
  private readonly root: RootStore;
  @observable.ref
  private state = new State();

  loginDisposer: IReactionDisposer;

  constructor(root: RootStore) {
    this.root = root;

    this.loginDisposer = reaction(
      () => this.root.session.isLoggedIn,
      (loggedIn) => {
        if (loggedIn) {
          this.loadDbServers(true);
        } else {
          this.clearStore();
        }
      }
    );
  }

  componentWillUnmount() {
    this.loginDisposer();
  }

  @computed
  get activeDbServerId(): string {
    return this.state.activeDbServerId;
  }

  @computed
  get activeDbServer(): DbServer | undefined {
    if (!this.state.activeDbServerId) {
      return;
    }
    return this.findDbServer(this.state.activeDbServerId);
  }

  setActiveDbServer(id: string) {
    this.state.activeDbServerId = id;
  }

  // closeConnection(connection: DbServer) {
  //   if (this.activeConnection === connection) {
  //     const connectionCount = this.loadedConnections.length;
  //     if (connectionCount > 0) {
  //       this.activeConnection = this.loadedConnections[connectionCount - 1];
  //     } else {
  //       this.activeConnection = null;
  //     }
  //   }
  // }

  get cancelToken() {
    return this.root.cancelToken;
  }

  @computed
  get dbServers() {
    return this.state.dbServers;
  }

  @computed
  get saveState() {
    return this.state.saveState;
  }

  @computed get loadedDbServers(): DbServer[] {
    return this.root.databases.dbServerIdsWithLoadedDatabases.map(
      (id) => this.findDbServer(id)!
    );
  }

  findDbServer(id: string): DbServer | undefined {
    return this.state.dbServers.find((c) => c.id === id);
  }

  @computed
  get isLoaded() {
    return this.state.loadState === LoadState.Success;
  }

  @action loadDbServers(forceReload: boolean = false) {
    if ((this.isLoaded && !forceReload) || this.state.loadState === LoadState.Loading) {
      return;
    }

    this.state.loadState = LoadState.Loading;

    dbServers(this.root.cancelToken)
      .then(({ data }) => {
        const dbServers = _.sortBy(data, ['name']).map(
          (dbConnection) => new DbServer(dbConnection, this.root.cancelToken)
        );
        this.state.dbServers.replace(dbServers);
        this.state.loadState = LoadState.Success;
      })
      .catch(() => {
        console.log('Could not fetch db connections');
        this.state.loadState = LoadState.Error;
      });
  }

  @action updateDbServer(dbConnection: TempDbServer) {
    this.state.saveState = RequestState.Waiting;
    updateDbServer(dbConnection.params, this.root.cancelToken)
      .then(() => {
        const connection = this.state.dbServers.find((db) => db.id === dbConnection.id);
        if (!connection) return;
        this.state.dbServers.remove(connection);
        this.state.dbServers.push(
          new DbServer(dbConnection.props, this.root.cancelToken)
        );
        this.state.saveState = RequestState.Success;
      })
      .catch(() => {
        this.state.saveState = RequestState.Error;
      });
  }

  @action createDbServer(dbConnection: TempDbServer) {
    this.state.saveState = RequestState.Waiting;
    createDbServer(dbConnection.tempDbPorps, this.root.cancelToken)
      .then(({ data }) => {
        this.state.dbServers.push(new DbServer(data, this.root.cancelToken));
        this.state.saveState = RequestState.Success;
      })
      .catch(() => {
        this.state.saveState = RequestState.Error;
      });
  }

  @action clearStore() {
    this.state.dbServers.clear();
  }

  @action remove(dbServer: TempDbServer) {
    removeApi(dbServer.id, this.root.cancelToken)
      .then(() => {
        const connection = this.state.dbServers.find((con) => con.id === dbServer.id);
        if (!connection) {
          return;
        }
        this.state.dbServers.remove(connection);
      })
      .catch((e) => {
        console.log(e);
      });
  }

  executeQuery() {
    const dbServer = this.activeDbServer;
    const database = dbServer?.activeDatabase;
    const activeQuery = database?.activeQuery;
    if (!dbServer || !database || !activeQuery) {
      return;
    }

    activeQuery.requestState = REST.Requested;
    const rawInput = activeQuery.query;
    const t0 = Date.now();
    const queries = identifyCommands(rawInput);
    console.log('Time to parse: ', (Date.now() - t0) / 1000.0);
    fetchQuery(dbServer.id, database.name, queries, this.root.cancelToken)
      .then(({ data }) => {
        console.log('Got result: ', (Date.now() - t0) / 1000.0);
        activeQuery.results = data;
        console.log(data);
        activeQuery.requestState = REST.Success;
      })
      .catch((e) => {
        activeQuery.requestState = REST.Error;
      });
  }

  @action cleanup() {
    this.state = new State();
  }

  @computed
  get tempDbServer(): TempDbServer | undefined {
    return this.state.tempDbServer;
  }

  @action
  setTempDbServer(tempDbServer?: TempDbServer) {
    this.state.tempDbServer = tempDbServer;
  }
}

export default DbServerStore;
