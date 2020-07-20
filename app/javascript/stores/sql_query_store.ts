import { observable, action, reaction, computed } from 'mobx';
import { RootStore, Store } from './root_store';
import _ from 'lodash';
import { getSqlQueries, update, SqlQuery as SqlQueryProps } from '../api/sql_query';
import SqlQuery from '../models/SqlQuery';
import { computedFn } from 'mobx-utils';

class State {
  sqlQueries = observable<SqlQuery>([]);
  @observable selectedQueryId?: string;
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

  @computed
  get sqlQueries(): SqlQuery[] {
    return _.orderBy(this.state.sqlQueries, ['isFavorite', 'createdAt'], 'desc');
  }

  find = computedFn(
    function (this: SqlQueryStore, id?: string): SqlQuery | undefined {
      if (!id) {
        return;
      }
      return this.state.sqlQueries.find((q) => q.id === id);
    },
    { keepAlive: true }
  );

  @action
  setSelectedSqlQueryId(id: string | undefined) {
    this.state.selectedQueryId = id;
  }

  @action
  refresh() {
    this.state = new State();
    this.loadSqlQueries();
  }

  @computed
  get selectedSqlQuery(): SqlQuery | undefined {
    if (!this.state.selectedQueryId) {
      return this.sqlQueries[0];
    }
    return this.find(this.state.selectedQueryId);
  }

  @action
  loadSqlQueries(): Promise<boolean> {
    return getSqlQueries(this.root.cancelToken).then(({ data }) => {
      const queries = data.map(
        (sqlQuery) => new SqlQuery(this, this.root.dbServer, this.root.user, sqlQuery)
      );
      this.state.sqlQueries.replace(queries);
      return true;
    });
  }

  @action
  updateSqlQuery(sqlQuery: SqlQuery) {
    if (!sqlQuery.isDirty) {
      return;
    }
    update(sqlQuery.id, sqlQuery.changeablProps).then(({ data }) => {
      this.addSqlQuery(data);
    });
  }

  @action
  addSqlQuery(sqlQuery: SqlQueryProps) {
    const oldQuery = this.find(sqlQuery.id);
    if (oldQuery) {
      this.state.sqlQueries.remove(oldQuery);
    }
    this.state.sqlQueries.push(new SqlQuery(this, this.root.dbServer, this.root.user, sqlQuery));
  }

  @action
  cleanup() {
    this.state = new State();
  }
}

export default SqlQueryStore;
