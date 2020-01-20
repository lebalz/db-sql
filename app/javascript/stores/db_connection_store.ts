import { observable, action, reaction, computed } from 'mobx';
import { RootStore } from './root_store';
import _ from 'lodash';
import { dbConnections, updateConnection, createConnection, remove as removeApi } from '../api/db_connection';
import { RequestState } from './session_store';
import DbConnection from '../models/DbConnection';
import { TempDbConnection } from '../models/TempDbConnection';

class DbConnectionStore {
  private readonly root: RootStore;
  dbConnections = observable<DbConnection>([]);
  @observable requestState: RequestState = RequestState.None;
  @observable saveState: RequestState = RequestState.None;

  @observable tempDbConnection: null | TempDbConnection = null;
  @observable activeConnection: null | DbConnection = null;

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

  @computed get loadedConnections() {
    return this.dbConnections.filter(conn => !!conn.isLoaded);
  }

  @action setActiveConnection(dbConnection: DbConnection) {
    this.root.routing.push('/connections');
    Promise.all([
      dbConnection.loadDatabases()
    ]).then(() => {
      this.activeConnection = dbConnection;
    });
  }

  @action loadDbConnections(forceReload: boolean = false) {
    if (!forceReload && this.dbConnections.length > 0) return;

    this.requestState = RequestState.Waiting;

    dbConnections().then(({ data }) => {
      const dbConnections = _.sortBy(data, ['name'])
        .map(dbConnection => new DbConnection(dbConnection));
      this.dbConnections.replace(dbConnections);
      this.requestState = RequestState.Success;
    }).catch(() => {
      console.log('Could not fetch db connections');
      this.requestState = RequestState.Error;
    }).then(
      result => new Promise(resolve => setTimeout(resolve, 2000, result))
    ).finally(
      () => this.requestState = RequestState.None
    );
  }

  @action updateDbConnection(dbConnection: TempDbConnection) {
    this.saveState = RequestState.Waiting;
    updateConnection(dbConnection.params).then(() => {
      const connection = this.dbConnections.find(db => db.id === dbConnection.id);
      if (!connection) return;
      this.dbConnections.remove(connection);
      this.dbConnections.push(
        new DbConnection(dbConnection.props)
      );
      this.saveState = RequestState.Success;
    }).catch(() => {
      this.saveState = RequestState.Error;
    });
  }

  @action createDbConnection(dbConnection: TempDbConnection) {
    this.saveState = RequestState.Waiting;
    createConnection(dbConnection.tempDbPorps).then(({ data }) => {
      this.dbConnections.push(
        new DbConnection(data)
      );
      this.saveState = RequestState.Success;
    }).catch(() => {
      this.saveState = RequestState.Error;
    });
  }

  @action clearStore() {
    this.dbConnections.clear();
  }

  @action remove(dbConnection: TempDbConnection) {
    removeApi(dbConnection.id).then(() => {
      const connection = this.dbConnections.find(con => con.id === dbConnection.id);
      if (!connection) {
        return;
      }
      this.dbConnections.remove(connection);
    }).catch((e) => {
      console.log(e);
    });
  }

}

export default DbConnectionStore;