import { observable, action, reaction } from 'mobx';
import { RootStore, Store } from './root_store';
import _ from 'lodash';
import { getSqlQueries } from '../api/sql_query';
import SqlQuery from '../models/SqlQuery';

class State {
  sqlQueries = observable<SqlQuery>([]);
}

class SqlQueryStore implements Store {
  private readonly root: RootStore;
  @observable.ref
  private state = new State();

  constructor(root: RootStore) {
    this.root = root;
    reaction(
      () => this.root.session.isLoggedIn,
      (isLoggedIn) => {
        if (isLoggedIn) {
          this.loadSqlQueries();
        }
      }
    );
  }

  @action
  loadSqlQueries(): Promise<boolean> {
    return getSqlQueries(this.root.cancelToken).then(({ data }) => {
      const queries = data.map((sqlQuery) => new SqlQuery(this, this.root.dbServer, this.root.user, sqlQuery));
      this.state.sqlQueries.replace(queries);
      return true;
    });
  }

  @action
  cleanup() {
    this.state = new State();
  }
}

export default SqlQueryStore;
