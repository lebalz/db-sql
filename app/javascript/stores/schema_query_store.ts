import { observable, action, computed, reaction } from 'mobx';
import { computedFn } from 'mobx-utils';
import { RootStore, Store } from './root_store';
import _ from 'lodash';
import {
  databaseSchemaQuery,
  revisions,
  defaultDatabaseSchemaQueries,
  latestRevisions,
  newRevision,
  remove
} from '../api/database_schema_query';
import SchemaQuery from '../models/SchemaQuery';
import { DbType } from '../models/DbServer';
import { REST } from '../declarations/REST';

class State {
  schemaQueries = observable<SchemaQuery>([]);
  @observable loadedSchemaQueries: { [key in DbType]: number } = {
    [DbType.MySql]: 20,
    [DbType.Psql]: 20
  };
  @observable requestState: REST = REST.None;
  @observable selectedSchemaQueryId?: string = undefined;
  @observable selectedDbType: DbType = DbType.Psql;
}

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
          this.loadLatestRevisions()
        }
      }
    );

    reaction(
      () => this.selectedSchemaQuery,
      (selected) => {
        if (selected) {
          if (selected) {
            if (selected.revisionsLoaded) {
              selected.updateRevisionBranch();
            } else {
              selected.loadRevisions().then(() => {
                selected.updateRevisionBranch();
              });
            }
          }
        }
      }
    );
  }

  @computed
  get selectedSchemaQuery(): SchemaQuery | undefined {
    if (!this.state.selectedSchemaQueryId) {
      return this.latestSchemaQueries.find((q) => !q.isDefault && q.dbType === this.selectedDbType);
    }
    return this.find(this.state.selectedSchemaQueryId);
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
    return this.state.schemaQueries;
  }

  @computed
  get latestSchemaQueries() {
    return this.state.schemaQueries.filter((q) => q.isDefault || q.isLatest);
  }

  default(dbType: DbType): SchemaQuery {
    return this.schemaQueries.find((q) => q.isDefault && q.dbType === dbType)!;
  }

  find = computedFn(
    function (this: SchemaQueryStore, id?: string): SchemaQuery | undefined {
      if (!id) {
        return;
      }
      return this.schemaQueries.find((q) => q.id === id);
    },
    { keepAlive: true }
  );

  queriesFor = computedFn(
    function (this: SchemaQueryStore, dbType: DbType): SchemaQuery[] {
      return this.schemaQueries.filter((q) => q.dbType === dbType);
    },
    { keepAlive: true }
  );

  @action
  save(schemaQuery: SchemaQuery) {
    this.state.requestState = REST.Requested;
    newRevision(schemaQuery.id, schemaQuery.revisionProps)
      .then(({ data }) => {
        this.state.schemaQueries.push(new SchemaQuery(this, data, true));
        this.setSelectedSchemaQueryId(data.id);
        schemaQuery.isLatest = false;
        this.state.requestState = REST.Success;
      })
      .catch(() => {
        this.state.requestState = REST.Error;
      });
  }

  @action
  destroy(schemaQuery: SchemaQuery) {
    this.state.requestState = REST.Requested;
    remove(schemaQuery.id)
      .then(() => {
        const previous = schemaQuery.previousRevision;
        this.state.schemaQueries.remove(schemaQuery);
        if (previous) {
          previous.isLatest = true;
          this.setSelectedSchemaQueryId(previous.id);
        }
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
        this.state.schemaQueries.push(new SchemaQuery(this, schemaQuery, true));
      });
    });
  }

  @action
  loadLatestRevisions(): Promise<void[]> {
    return Promise.all(
      Object.values(DbType).map((dbType) => {
        return latestRevisions(0, this.state.loadedSchemaQueries[dbType], dbType).then(({ data }) => {
          data.forEach((schemaQuery) => {
            const oldValue = this.find(schemaQuery.id);
            if (oldValue) {
              this.state.schemaQueries.remove(oldValue);
            }
            this.state.schemaQueries.push(new SchemaQuery(this, schemaQuery));
          });
        });
      })
    );
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
  loadRevisions(id: string): Promise<boolean> {
    return revisions(id)
      .then(({ data }) => {
        data.forEach((schemaQuery) => {
          if (schemaQuery.is_default) {
            return;
          }
          const oldValue = this.find(schemaQuery.id);
          if (oldValue) {
            this.state.schemaQueries.remove(oldValue);
          }
          this.state.schemaQueries.push(new SchemaQuery(this, schemaQuery, true));
        });
        return Promise.resolve(true);
      })
      .catch(() => {
        return Promise.resolve(false);
      });
  }

  @action cleanup() {
    this.state = new State();
  }
}

export default SchemaQueryStore;
