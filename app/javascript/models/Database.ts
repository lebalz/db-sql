import { observable, computed, action } from 'mobx';
import { Database as DatabaseProps } from '../api/db_server';
import _ from 'lodash';
import DbServer from './DbServer';
import DbTable from './DbTable';
import QueryEditor from './QueryEditor';
import DbSchema from './DbSchema';
import DbColumn from './DbColumn';

export default class Database {
  readonly dbServer: DbServer;
  readonly name: string;
  readonly dbServerId: string;
  readonly schemas: DbSchema[];
  editors = observable<QueryEditor>([]);
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
  replaceQuery(query: QueryEditor) {
    const oldQuery = this.editors.find((q) => q.id === query.id);
    if (oldQuery) {
      this.editors.remove(oldQuery);
    }
    this.editors.push(query);
  }

  @action
  incrementQueryCount(queryCount: number, errorCount: number) {
    this.dbServer.incrementQueryCount(queryCount, errorCount);
  }

  @action
  copyFrom(database: Database) {
    this.editors.clear();
    database.editors.forEach((query) => {
      this.editors.push(query.createCopyFor(database));
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

  /**
   * returns a unique identifier for this db
   * !!! but it is NOT a uuid !!!
   */
  @computed
  get id() {
    return `${this.dbServer.id}-${this.name}`;
  }

  @computed
  get activeQuery() {
    return this.editors.find((query) => query.id === this.activeQueryId);
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
  addQuery(): QueryEditor {
    const editor = this.dbServer.newEditor(this, this.nextQueryId);
    this.editors.push(editor);
    this.setActiveQuery(editor.id);
    return editor;
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
    if (this.show && this.editors.length === 0) {
      this.addQuery();
    }
  }

  @computed
  get isActive(): boolean {
    return this.name === this.dbServer.activeDatabaseName && this.dbServer.isActive;
  }

  @action
  setDefaultQueryActive() {
    if (this.editors.length > 0) {
      const lastQuery = this.editors[this.editors.length - 1];
      this.setActiveQuery(lastQuery.id);
    }
  }

  @action
  removeQuery(query: QueryEditor) {
    const idx = this.editors.indexOf(query);
    if (idx >= 0) {
      this.editors.remove(query);
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
    return this.editors.reduce((maxId, query) => (maxId > query.id ? maxId : query.id), 0) + 1;
  }
}
