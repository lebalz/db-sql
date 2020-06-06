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
  create,
  databaseSchemaQueryCounts
} from '../api/database_schema_query';
import SchemaQuery from '../models/SchemaQuery';
import { DbType } from '../models/DbServer';
import { REST } from '../declarations/REST';

interface LoadedSchemaQueries {
  loaded: number;
  state: REST;
  available: number;
}

class State {
  schemaQueries = observable<SchemaQuery>([]);
  @observable loadedSchemaQueries: { [key in DbType]: LoadedSchemaQueries } = {
    [DbType.MySql]: {
      available: 0,
      loaded: 0,
      state: REST.None,
    },
    [DbType.Psql]: {
      available: 0,
      loaded: 0,
      state: REST.None,
    }
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
          this.loadSchemaQueryCounts();
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
  refresh() {
    this.state = new State();
    this.loadDefaultQueries();
    this.loadSchemaQueryCounts();
    this.loadNextBatch(DbType.MySql);
    this.loadNextBatch(DbType.Psql);
  }

  @action
  loadNextBatch(dbType: DbType) {
    if (this.state.loadedSchemaQueries[dbType].state === REST.Requested) {
      return;
    }
    this.state.loadedSchemaQueries[dbType].state = REST.Requested;
    const offset = this.state.loadedSchemaQueries[dbType].loaded;
    databaseSchemaQueries({
      db_type: dbType,
      limit: BATCH_SIZE,
      offset: offset
    })
      .then(({ data }) => {
        data.forEach((schemaQuery, idx) => {
          runInAction(() => {
            if (schemaQuery.is_default) {
              const oldDefault = this.state.schemaQueries.find((q) => q.id === schemaQuery.id);
              if (oldDefault) {
                this.state.schemaQueries.remove(oldDefault);
              }
            }
            this.state.schemaQueries.push(new SchemaQuery(this, schemaQuery, offset + idx + 1));
          });
        });
        this.state.loadedSchemaQueries[dbType].loaded += data.length;
        this.state.loadedSchemaQueries[dbType].state = REST.Success;
      })
      .catch((err) => {
        this.state.loadedSchemaQueries[dbType].state = REST.Error;
      });
  }

  @action
  addEmptySchemaQuery() {
    const tempId = `${Date.now()}`;
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
          id: tempId,
          stats: {
            reference_count: 0,
            public_user_count: 0
          }
        },
        0,
        false
      )
    );
    this.setSelectedSchemaQueryId(tempId);
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
  get fetchRequestState() {
    return this.state.loadedSchemaQueries;
  }

  @computed
  get schemaQueries() {
    return _.orderBy(
      this.state.schemaQueries.filter((q) => q.dbType === this.selectedDbType),
      ['orderPosition', 'updatedAt'],
      ['asc', 'desc']
    );
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

  canEdit(schemaQuery: SchemaQuery): boolean {
    return schemaQuery.authorId === this.root.session.currentUser.id;
  }

  @action
  save(schemaQuery: SchemaQuery) {
    this.state.requestState = REST.Requested;
    update(schemaQuery.updateProps)
      .then(({ data }) => {
        this.state.schemaQueries.remove(schemaQuery);
        this.state.schemaQueries.push(new SchemaQuery(this, data, 0));
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
        this.state.schemaQueries.push(new SchemaQuery(this, data, 0));
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
        this.state.schemaQueries.push(new SchemaQuery(this, schemaQuery, 0));
      });
    });
  }

  @action
  loadSchemaQueryCounts() {
    databaseSchemaQueryCounts().then(({ data }) => {
      Object.values(DbType).forEach((db_type) => {
        this.state.loadedSchemaQueries[db_type].available = data[db_type];
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
      this.state.schemaQueries.push(new SchemaQuery(this, data, oldValue?.orderPosition ?? 0));
    });
  }

  @action cleanup() {
    this.state = new State();
  }
}

export default SchemaQueryStore;
