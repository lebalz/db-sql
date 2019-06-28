import { observable, action, reaction } from 'mobx';
import { RootStore } from './root_store';
import _ from 'lodash';
import { dbConnections } from '../api/db_connection';
import { RequestState } from './session_store';
import DbConnection from '../models/DbConnection';

class DbConnectionStore {
  private readonly root: RootStore;
  dbConnections = observable<DbConnection>([]);
  @observable requestState: RequestState = RequestState.None;
  @observable editedDbConnection: null | DbConnection = null;

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
    reaction(
      () => this.editedDbConnection,
      (connection) => {
        if (connection) {
          connection.loadPassword();
        }
      }
    );
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

  @action clearStore() {
    this.dbConnections.clear();
  }

}

export default DbConnectionStore;