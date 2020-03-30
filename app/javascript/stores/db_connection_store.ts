import { observable, action, reaction, computed, IReactionDisposer } from 'mobx';
import { RootStore } from './root_store';
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

class DbConnectionStore {
  private readonly root: RootStore;
  dbConnections = observable<DbConnection>([]);
  @observable loadState: LoadState = LoadState.None;
  @observable saveState: RequestState = RequestState.None;

  @observable tempDbConnection: null | TempDbConnection = null;
  @observable activeConnectionId?: string = undefined;
  @observable queryState: RequestState = RequestState.None;

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
    if (!this.activeConnectionId) {
      return;
    }
    return this.findDbConnection(this.activeConnectionId);
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

  @computed get loadedConnections() {
    return this.dbConnections.filter((conn) => !!conn.isLoaded);
  }

  findDbConnection(id: string): DbConnection | undefined {
    return this.dbConnections.find((c) => c.id === id);
  }

  setActiveConnection(id: string) {
    this.activeConnectionId = id;
    if (!this.isLoaded) {
      return;
    }
    return Promise.all([this.activeConnection?.loadDatabases()]);
  }

  @computed
  get isLoaded() {
    return this.loadState === LoadState.Success;
  }

  @action loadDbConnections(forceReload: boolean = false) {
    if ((this.isLoaded && !forceReload) || this.loadState === LoadState.Loading) {
      return;
    }

    this.loadState = LoadState.Loading;

    dbConnections()
      .then(({ data }) => {
        const dbConnections = _.sortBy(data, ['name']).map(
          (dbConnection) => new DbConnection(dbConnection)
        );
        this.dbConnections.replace(dbConnections);
        this.loadState = LoadState.Success;
      })
      .catch(() => {
        console.log('Could not fetch db connections');
        this.loadState = LoadState.Error;
      });
  }

  @action updateDbConnection(dbConnection: TempDbConnection) {
    this.saveState = RequestState.Waiting;
    updateConnection(dbConnection.params)
      .then(() => {
        const connection = this.dbConnections.find((db) => db.id === dbConnection.id);
        if (!connection) return;
        this.dbConnections.remove(connection);
        this.dbConnections.push(new DbConnection(dbConnection.props));
        this.saveState = RequestState.Success;
      })
      .catch(() => {
        this.saveState = RequestState.Error;
      });
  }

  @action createDbConnection(dbConnection: TempDbConnection) {
    this.saveState = RequestState.Waiting;
    createConnection(dbConnection.tempDbPorps)
      .then(({ data }) => {
        this.dbConnections.push(new DbConnection(data));
        this.saveState = RequestState.Success;
      })
      .catch(() => {
        this.saveState = RequestState.Error;
      });
  }

  @action clearStore() {
    this.dbConnections.clear();
  }

  @action remove(dbConnection: TempDbConnection) {
    removeApi(dbConnection.id)
      .then(() => {
        const connection = this.dbConnections.find((con) => con.id === dbConnection.id);
        if (!connection) {
          return;
        }
        this.dbConnections.remove(connection);
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
    fetchQuery(connection.id, database.name, queries)
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
}

export default DbConnectionStore;
