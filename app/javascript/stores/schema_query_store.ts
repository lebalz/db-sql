import { observable, action, computed, reaction } from 'mobx';
import { computedFn } from 'mobx-utils';
import { RootStore, Store } from './root_store';
import _ from 'lodash';
import {
  databaseSchemaQuery,
  DatabaseSchemaQuery,
  revisions,
  defaultDatabaseSchemaQueries
} from '../api/database_schema_query';
import SchemaQuery from '../models/SchemaQuery';
import { DbType } from '../models/DbServer';

class State {
  schemaQueries = observable<SchemaQuery>([]);
}

class SchemaQueryStore implements Store {
  private readonly root: RootStore;
  @observable.ref
  private state = new State();
  defaultSchemaQueries = observable<SchemaQuery>([]);

  constructor(root: RootStore) {
    this.root = root;
    this.loadDefaultQueries();
    reaction(
      () => this.root.session.isLoggedIn,
      (isLoggedIn) => {
        if (isLoggedIn) {

        }
      }
    )
  }

  @computed
  get schemaQueries() {
    return [...this.defaultSchemaQueries, ...this.state.schemaQueries];
  }

  default(dbType: DbType): SchemaQuery {
    return this.schemaQueries.find((q) => q.isDefault && q.dbType === dbType)!;
  }

  find = computedFn(function (this: SchemaQueryStore, id: string): SchemaQuery | undefined {
    return this.schemaQueries.find((q) => q.id === id);
  });

  queriesFor = computedFn(function (this: SchemaQueryStore, dbType: DbType): SchemaQuery[] {
    return this.schemaQueries.filter((q) => q.dbType === dbType);
  });

  @action
  loadDefaultQueries() {
    defaultDatabaseSchemaQueries().then(({ data }) => {
      this.defaultSchemaQueries.replace(data.map((schemaQuery) => new SchemaQuery(this, schemaQuery)));
    });
  }

  @action
  loadLatestRevisions() {
    defaultDatabaseSchemaQueries().then(({ data }) => {
      this.defaultSchemaQueries.replace(data.map((schemaQuery) => new SchemaQuery(this, schemaQuery)));
    });
  }

  @action
  loadSchemaQuery(id: string) {
    databaseSchemaQuery(id).then(({ data }) => {
      if (data.is_default) {
        return this.loadDefaultQueries();
      }
      const oldValue = this.find(id);
      if (oldValue) {
        this.state.schemaQueries.remove(oldValue);
      }
      this.state.schemaQueries.push(new SchemaQuery(this, data));
    });
  }

  @action
  loadRevisions(id: string) {
    revisions(id).then(({ data }) => {
      data.forEach((schemaQuery) => {
        if (schemaQuery.is_default) {
          return;
        }
        const oldValue = this.find(schemaQuery.id);
        if (oldValue) {
          this.state.schemaQueries.remove(oldValue);
        }
        this.state.schemaQueries.push(new SchemaQuery(this, schemaQuery));
      });
    });
  }

  @action cleanup() {
    this.state = new State();
  }
}

export default SchemaQueryStore;
