import { observable, action, reaction, computed, IReactionDisposer } from 'mobx';
import { RootStore, Store } from './root_store';
import _ from 'lodash';
import {
  dbConnections,
  updateConnection,
  createConnection,
  remove as removeApi,
  query as fetchQuery
} from '../api/db_connection';
import DbConnection from '../models/DbConnection';
import { TempDbConnection } from '../models/TempDbConnection';
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
  None
}

class State {
  dbConnections = observable<DbConnection>([]);
  @observable loadState: LoadState = LoadState.None;
  @observable saveState: RequestState = RequestState.None;

  @observable tempDbConnection?: TempDbConnection = undefined;
  @observable activeConnectionId?: string = undefined;
  @observable queryState: RequestState = RequestState.None;
}

class DbConnectionStore implements Store {
  private readonly root: RootStore;
  @observable.ref
  private state = new State();

  loginDisposer: IReactionDisposer;
  loadDisposer: IReactionDisposer;

  constructor(root: RootStore) {
    this.root = root;

    this.loginDisposer = reaction(
      () => this.root.session.isLoggedIn,
      (loggedIn) => {
        if (loggedIn) {
          this.loadDbConnections(true);
        } else {
          this.clearStore();
        }
      }
    );

    this.loadDisposer = reaction(
      () => this.isLoaded,
      (isLoaded) => {
        if (isLoaded && this.activeConnection) {
          this.activeConnection.loadDatabases();
        }
      }
    );
  }

  componentWillUnmount() {
    this.loginDisposer();
    this.loadDisposer();
  }

  @computed
  get activeConnection(): DbConnection | undefined {
    if (!this.state.activeConnectionId) {
      return;
    }
    return this.findDbConnection(this.state.activeConnectionId);
  }

  // closeConnection(connection: DbConnection) {
  //   if (this.activeConnection === connection) {
  //     const connectionCount = this.loadedConnections.length;
  //     if (connectionCount > 0) {
  //       this.activeConnection = this.loadedConnections[connectionCount - 1];
  //     } else {
  //       this.activeConnection = null;
  //     }
  //   }
  // }

  setTempDbConnection(dbConnection?: TempDbConnection) {
    this.state.tempDbConnection = dbConnection;
  }

  get cancelToken() {
    return this.root.cancelToken;
  }

  @computed
  get tempDbConnection(): TempDbConnection | undefined {
    return this.state.tempDbConnection;
  }

  @computed
  get dbConnections() {
    return this.state.dbConnections;
  }

  @computed
  get saveState() {
    return this.state.saveState;
  }

  @computed get loadedConnections() {
    return this.state.dbConnections.filter((conn) => !!conn.isLoaded);
  }

  findDbConnection(id: string): DbConnection | undefined {
    return this.state.dbConnections.find((c) => c.id === id);
  }

  setActiveConnection(id: string) {
    this.state.activeConnectionId = id;
    if (!this.isLoaded) {
      return;
    }
    return Promise.all([this.activeConnection?.loadDatabases()]);
  }

  @computed
  get isLoaded() {
    return this.state.loadState === LoadState.Success;
  }

  @action loadDbConnections(forceReload: boolean = false) {
    if ((this.isLoaded && !forceReload) || this.state.loadState === LoadState.Loading) {
      return;
    }

    this.state.loadState = LoadState.Loading;

    dbConnections(this.root.cancelToken)
      .then(({ data }) => {
        const dbConnections = _.sortBy(data, ['name']).map(
          (dbConnection) => new DbConnection(dbConnection, this.root.cancelToken)
        );
        this.state.dbConnections.replace(dbConnections);
        this.state.loadState = LoadState.Success;
      })
      .catch(() => {
        console.log('Could not fetch db connections');
        this.state.loadState = LoadState.Error;
      });
  }

  @action updateDbConnection(dbConnection: TempDbConnection) {
    this.state.saveState = RequestState.Waiting;
    updateConnection(dbConnection.params, this.root.cancelToken)
      .then(() => {
        const connection = this.state.dbConnections.find(
          (db) => db.id === dbConnection.id
        );
        if (!connection) return;
        this.state.dbConnections.remove(connection);
        this.state.dbConnections.push(
          new DbConnection(dbConnection.props, this.root.cancelToken)
        );
        this.state.saveState = RequestState.Success;
      })
      .catch(() => {
        this.state.saveState = RequestState.Error;
      });
  }

  @action createDbConnection(dbConnection: TempDbConnection) {
    this.state.saveState = RequestState.Waiting;
    createConnection(dbConnection.tempDbPorps, this.root.cancelToken)
      .then(({ data }) => {
        this.state.dbConnections.push(new DbConnection(data, this.root.cancelToken));
        this.state.saveState = RequestState.Success;
      })
      .catch(() => {
        this.state.saveState = RequestState.Error;
      });
  }

  @action clearStore() {
    this.state.dbConnections.clear();
  }

  @action remove(dbConnection: TempDbConnection) {
    removeApi(dbConnection.id, this.root.cancelToken)
      .then(() => {
        const connection = this.state.dbConnections.find(
          (con) => con.id === dbConnection.id
        );
        if (!connection) {
          return;
        }
        this.state.dbConnections.remove(connection);
      })
      .catch((e) => {
        console.log(e);
      });
  }

  executeQuery() {
    const connection = this.activeConnection;
    const database = connection?.activeDatabase;
    const activeQuery = database?.activeQuery;
    if (!connection || !database || !activeQuery) {
      return;
    }

    activeQuery.requestState = REST.Requested;
    const rawInput = activeQuery.query;
    const t0 = Date.now();
    const queries = identifyCommands(rawInput);
    console.log('Time to parse: ', (Date.now() - t0) / 1000.0);
    fetchQuery(connection.id, database.name, queries, this.root.cancelToken)
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
}

export default DbConnectionStore;
