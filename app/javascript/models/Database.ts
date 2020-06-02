import { observable, computed, action } from 'mobx';
import { Database as DatabaseProps, Column } from '../api/db_server';
import _ from 'lodash';
import DbServer from './DbServer';
import DbTable from './DbTable';
import Query from './Query';
import DbSchema from './DbSchema';
import DbColumn from './DbColumn';

export default class Database {
  readonly dbServer: DbServer;
  readonly name: string;
  readonly dbServerId: string;
  readonly schemas: DbSchema[];
  queries = observable<Query>([]);
  @observable activeQueryId: number = 1;

  @observable show: boolean = false;
  @observable isLoading: boolean = false;
  @observable loadError?: string;

  constructor(dbServer: DbServer, props: DatabaseProps) {
    this.dbServer = dbServer;
    this.addQuery();
    this.name = props.name;
    this.dbServerId = props.db_server_id;
    this.schemas = props.schemas.map((schema) => new DbSchema(this, schema));
    this.connectForeignKeys();
  }

  @action
  setActiveQuery(id: number) {
    this.activeQueryId = id;
  }

  @computed
  get hasMultipleSchemas(): boolean {
    return this.schemas.length > 1;
  }

  @action
  replaceQuery(query: Query) {
    const oldQuery = this.queries.find((q) => q.id === query.id);
    if (oldQuery) {
      this.queries.remove(oldQuery);
    }
    this.queries.push(query);
  }

  @action
  incrementQueryCount(queryCount: number, errorCount: number) {
    this.dbServer.incrementQueryCount(queryCount, errorCount);
  }

  @action
  copyFrom(database: Database) {
    this.queries.clear();
    database.queries.forEach((query) => {
      this.queries.push(query.createCopyFor(database));
    });
    this.activeQueryId = database.activeQueryId;
    this.show = database.show;
  }

  @action
  reload() {
    this.dbServer.reloadDatabase(this.name);
  }

  @computed
  get link() {
    return `${this.dbServer.link}/${this.name}`;
  }

  @computed
  get activeQuery() {
    return this.queries.find((query) => query.id === this.activeQueryId);
  }

  find(schemaName: string, tableName: string, columnName: string): DbColumn;
  find(schemaName: string, tableName: string, columnName?: string): DbTable;
  find(schemaName: string, tableName?: string, columnName?: string): DbSchema;
  find(
    schemaName: string,
    tableName?: string,
    columnName?: string
  ): DbSchema | DbTable | DbColumn | undefined {
    const dbSchema = this.schemas.find((s) => s.name === schemaName);
    if (!tableName || !dbSchema) {
      return dbSchema;
    }
    return dbSchema.find(tableName, columnName);
  }

  @action
  addQuery() {
    const query = new Query(this, this.nextQueryId);
    this.queries.push(query);
    this.setActiveQuery(query.id);
  }

  table(name: string): DbTable | undefined {
    return this.schemas[0].tables.find((table) => table.name === name);
  }

  @action
  toggleShow() {
    this.setShow(!this.show);
  }

  @action
  setShow(show: boolean) {
    this.show = show;
    if (this.show && this.queries.length === 0) {
      this.addQuery();
    }
  }

  @computed
  get isActive(): boolean {
    return this.name === this.dbServer.activeDatabaseName && this.dbServer.isActive;
  }

  @action
  setDefaultQueryActive() {
    if (this.queries.length > 0) {
      const lastQuery = this.queries[this.queries.length - 1];
      this.setActiveQuery(lastQuery.id);
    }
  }

  @action
  removeQuery(query: Query) {
    const idx = this.queries.indexOf(query);
    if (idx >= 0) {
      this.queries.remove(query);
      query.cancel();
      if (idx > 0) {
        this.setActiveQuery(idx - 1);
      }
    }
  }

  private connectForeignKeys() {
    this.schemas.forEach((schema) => {
      schema.tables.forEach((table) => {
        table.columns.forEach((column) => {
          column.linkForeignKeys(this);
        });
      });
    });
  }

  @computed
  private get nextQueryId(): number {
    return this.queries.reduce((maxId, query) => (maxId > query.id ? maxId : query.id), 0) + 1;
  }
}
