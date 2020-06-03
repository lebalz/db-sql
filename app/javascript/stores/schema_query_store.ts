import { observable, action, computed, reaction, runInAction } from 'mobx';
import { computedFn } from 'mobx-utils';
import { RootStore, Store } from './root_store';
import _ from 'lodash';
import {
  databaseSchemaQuery,
  defaultDatabaseSchemaQueries,
  remove,
  update,
  databaseSchemaQueries,
  create
} from '../api/database_schema_query';
import SchemaQuery from '../models/SchemaQuery';
import { DbType } from '../models/DbServer';
import { REST } from '../declarations/REST';

class State {
  schemaQueries = observable<SchemaQuery>([]);
  @observable loadedSchemaQueries: { [key in DbType]: number } = {
    [DbType.MySql]: 0,
    [DbType.Psql]: 0
  };
  @observable loadSchemaQueryStates: { [key in DbType]: REST } = {
    [DbType.MySql]: REST.None,
    [DbType.Psql]: REST.None
  };
  @observable requestState: REST = REST.None;
  @observable selectedSchemaQueryId?: string = undefined;
  @observable selectedDbType: DbType = DbType.Psql;
}

const BATCH_SIZE = 20;

class SchemaQueryStore implements Store {
  private readonly root: RootStore;
  @observable.ref
  private state = new State();

  constructor(root: RootStore) {
    this.root = root;
    this.loadDefaultQueries();
    reaction(
      () => this.root.session.isLoggedIn,
      (isLoggedIn) => {
        if (isLoggedIn) {
          this.loadNextBatch(DbType.MySql);
          this.loadNextBatch(DbType.Psql);
        }
      }
    );
  }

  @computed
  get selectedSchemaQuery(): SchemaQuery | undefined {
    if (!this.state.selectedSchemaQueryId) {
      return this.schemaQueries[0];
    }
    return this.find(this.state.selectedSchemaQueryId);
  }

  @action
  loadNextBatch(dbType: DbType) {
    if (this.state.loadSchemaQueryStates[dbType] === REST.Requested) {
      return;
    }
    this.state.loadSchemaQueryStates[dbType] === REST.Requested;
    databaseSchemaQueries({
      db_type: dbType,
      limit: BATCH_SIZE,
      offset: this.state.loadedSchemaQueries[dbType]
    })
      .then(({ data }) => {
        data.forEach((schemaQuery) => {
          runInAction(() => {
            if (schemaQuery.is_default) {
              const oldDefault = this.state.schemaQueries.find((q) => q.id === schemaQuery.id);
              if (oldDefault) {
                this.state.schemaQueries.remove(oldDefault);
              }
            }
            this.state.schemaQueries.push(new SchemaQuery(this, schemaQuery));
          });
        });
        this.state.loadedSchemaQueries[dbType] += BATCH_SIZE;
        this.state.loadSchemaQueryStates[dbType] === REST.Success;
      })
      .catch((err) => {
        this.state.loadSchemaQueryStates[dbType] === REST.Error;
      });
  }

  @action
  addEmptySchemaQuery() {
    this.state.schemaQueries.push(
      new SchemaQuery(
        this,
        {
          author_id: this.root.session.currentUser.id,
          db_type: this.selectedDbType,
          is_default: false,
          is_private: false,
          query: '',
          name: 'DATABASE SCHEMA QUERY',
          created_at: new Date().toUTCString(),
          updated_at: new Date().toUTCString(),
          id: ''
        },
        false
      )
    );
  }

  @action
  setSelectedSchemaQueryId(id: string | undefined) {
    this.state.selectedSchemaQueryId = id;
  }

  @computed
  get selectedDbType(): DbType {
    return this.state.selectedDbType;
  }

  @action
  setSelectedDbType(dbType: DbType) {
    this.state.selectedDbType = dbType;
    this.state.selectedSchemaQueryId = undefined;
  }

  @computed
  get requestState(): REST {
    return this.state.requestState;
  }

  @computed
  get schemaQueries() {
    return this.state.schemaQueries
      .filter((q) => q.dbType === this.selectedDbType)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  default(dbType: DbType): SchemaQuery {
    return this.schemaQueries.find((q) => q.isDefault && q.dbType === dbType)!;
  }

  find = computedFn(
    function (this: SchemaQueryStore, id?: string): SchemaQuery | undefined {
      if (!id) {
        return;
      }
      return this.state.schemaQueries.find((q) => q.id === id);
    },
    { keepAlive: true }
  );

  queriesFor = computedFn(
    function (this: SchemaQueryStore, dbType: DbType): SchemaQuery[] {
      return this.state.schemaQueries.filter((q) => q.dbType === dbType);
    },
    { keepAlive: true }
  );

  @action
  save(schemaQuery: SchemaQuery) {
    this.state.requestState = REST.Requested;
    update(schemaQuery.updateProps)
      .then(({ data }) => {
        this.state.schemaQueries.remove(schemaQuery);
        this.state.schemaQueries.push(new SchemaQuery(this, data));
        this.setSelectedSchemaQueryId(data.id);
        this.state.requestState = REST.Success;
      })
      .catch(() => {
        this.state.requestState = REST.Error;
      });
  }

  @action
  create(schemaQuery: SchemaQuery) {
    if (schemaQuery.isPersisted) {
      return;
    }
    this.state.requestState = REST.Requested;
    create(schemaQuery.createProps)
      .then(({ data }) => {
        this.state.schemaQueries.remove(schemaQuery);
        this.state.schemaQueries.push(new SchemaQuery(this, data));
        this.setSelectedSchemaQueryId(data.id);
        this.state.requestState = REST.Success;
      })
      .catch(() => {
        this.state.requestState = REST.Error;
      });
  }

  @action
  destroy(schemaQuery: SchemaQuery) {
    if (!schemaQuery.isPersisted) {
      this.state.schemaQueries.remove(schemaQuery);
      return;
    }
    this.state.requestState = REST.Requested;
    remove(schemaQuery.id)
      .then(() => {
        const idx = this.state.schemaQueries.indexOf(schemaQuery);
        this.state.schemaQueries.remove(schemaQuery);
        this.setSelectedSchemaQueryId(this.state.schemaQueries[idx > 0 ? idx - 1 : 0]?.id);
        this.state.requestState = REST.Success;
      })
      .catch(() => {
        this.state.requestState = REST.Error;
      });
  }

  @action
  loadDefaultQueries() {
    defaultDatabaseSchemaQueries().then(({ data }) => {
      data.forEach((schemaQuery) => {
        const oldValue = this.find(schemaQuery.id);
        if (oldValue) {
          this.state.schemaQueries.remove(oldValue);
        }
        this.state.schemaQueries.push(new SchemaQuery(this, schemaQuery));
      });
    });
  }

  @action
  loadSchemaQuery(id: string) {
    databaseSchemaQuery(id).then(({ data }) => {
      const oldValue = this.find(id);
      if (oldValue) {
        this.state.schemaQueries.remove(oldValue);
      }
      this.state.schemaQueries.push(new SchemaQuery(this, data));
    });
  }

  @action cleanup() {
    this.state = new State();
  }
}

export default SchemaQueryStore;
