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
import { RequestState } from './session_store';
import DbConnection from '../models/DbConnection';
import { TempDbConnection } from '../models/TempDbConnection';
import 'regenerator-runtime/runtime';
import { QuerySeparationGrammarLexer } from '../antlr/QuerySeparationGrammarLexer';
import { QuerySeparationGrammarParser } from '../antlr/QuerySeparationGrammarParser';
import { ANTLRInputStream, CommonTokenStream } from 'antlr4ts';

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

class DbConnectionStore {
  private readonly root: RootStore;
  dbConnections = observable<DbConnection>([]);
  @observable requestState: RequestState = RequestState.None;
  @observable saveState: RequestState = RequestState.None;

  @observable tempDbConnection: null | TempDbConnection = null;
  @observable activeConnection: null | DbConnection = null;
  @observable queryState: RequestState = RequestState.None;

  constructor(root: RootStore) {
    this.root = root;

    reaction(
      () => this.root.session.isLoggedIn,
      (loggedIn) => {
        if (loggedIn) {
          this.loadDbConnections(true);
        } else {
          this.clearStore();
        }
      }
    );
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

  @action setActiveConnection(dbConnection: DbConnection) {
    this.root.routing.push(`/connections/${dbConnection.id}`);
    Promise.all([dbConnection.loadDatabases()]).then(() => {
      this.activeConnection = dbConnection;
    });
  }

  @action loadDbConnections(forceReload: boolean = false) {
    if (!forceReload && this.dbConnections.length > 0) return;

    this.requestState = RequestState.Waiting;

    dbConnections()
      .then(({ data }) => {
        const dbConnections = _.sortBy(data, ['name']).map(
          (dbConnection) =>
            new DbConnection(dbConnection)
        );
        this.dbConnections.replace(dbConnections);
        this.requestState = RequestState.Success;
      })
      .catch(() => {
        console.log('Could not fetch db connections');
        this.requestState = RequestState.Error;
      })
      .then((result) => new Promise((resolve) => setTimeout(resolve, 2000, result)))
      .finally(() => (this.requestState = RequestState.None));
  }

  @action updateDbConnection(dbConnection: TempDbConnection) {
    this.saveState = RequestState.Waiting;
    updateConnection(dbConnection.params)
      .then(() => {
        const connection = this.dbConnections.find((db) => db.id === dbConnection.id);
        if (!connection) return;
        this.dbConnections.remove(connection);
        this.dbConnections.push(
          new DbConnection(dbConnection.props)
        );
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
    if (!this.activeConnection?.activeDatabase) {
      return;
    }
    this.queryState = RequestState.Waiting;
    const conn = this.activeConnection.activeDatabase;
    const rawInput = conn.query;
    const t0 = Date.now();
    const queries = identifyCommands(rawInput);
    console.log('Time to parse: ', (Date.now() - t0) / 1000.0);
    fetchQuery(this.activeConnection.id, conn.name, queries)
      .then(({ data }) => {
        console.log('Got result: ', (Date.now() - t0) / 1000.0);
        conn.results = data;
        console.log(data);
        this.queryState = RequestState.Success;
      })
      .catch((e) => {
        this.queryState = RequestState.Error;
      });
  }
}

export default DbConnectionStore;
