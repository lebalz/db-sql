import { observable, computed, action } from 'mobx';
import { DbServer as DbServerProps, databases } from '../api/db_server';
import _ from 'lodash';
import Database from './Database';
import { REST } from '../declarations/REST';
import { CancelTokenSource } from 'axios';
import DbServerStore from '../stores/db_server_store';
import Query from './Query';
import DbTable from './DbTable';
import SchemaQuery from './SchemaQuery';
import SchemaQueryStore from '../stores/schema_query_store';

export enum DbType {
  Psql = 'psql',
  MySql = 'mysql'
}

export enum QueryState {
  None,
  Executing,
  Success,
  Error
}

export interface UpdateProps extends Partial<DbServerProps> {
  id: string;
  password?: string;
}

export default class DbServer {
  private readonly dbServerStore: DbServerStore;
  private readonly schemaQueryStore: SchemaQueryStore;
  readonly id: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  @observable queryCount: number;
  @observable errorQueryCount: number;
  @observable name: string;
  @observable dbType: DbType;
  @observable host: string;
  @observable port: number;
  @observable username: string;
  @observable initDb?: string;
  @observable initTable?: string;
  @observable password?: string;
  @observable databaseSchemaQueryId: string;
  @observable queryState: QueryState = QueryState.None;

  @observable dbRequestState: REST = REST.None;
  cancelToken: CancelTokenSource;

  constructor(
    props: DbServerProps,
    dbServerStore: DbServerStore,
    schemaQueryStore: SchemaQueryStore,
    cancelToken: CancelTokenSource
  ) {
    this.dbServerStore = dbServerStore;
    this.schemaQueryStore = schemaQueryStore;
    this.id = props.id;
    this.name = props.name;
    this.dbType = props.db_type;
    this.host = props.host;
    this.port = props.port;
    this.username = props.username;
    this.initDb = props.initial_db;
    this.initTable = props.initial_table;
    this.queryCount = props.query_count;
    this.errorQueryCount = props.error_query_count;
    this.databaseSchemaQueryId = props.database_schema_query_id || schemaQueryStore.default(props.db_type).id;
    this.createdAt = new Date(props.created_at);
    this.updatedAt = new Date(props.updated_at);
    this.cancelToken = cancelToken;
  }

  static formatDate(date: Date) {
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  }

  @action
  incrementQueryCount(queryCount: number, errorCount: number) {
    this.queryCount += queryCount;
    this.errorQueryCount += errorCount;
  }

  @computed
  get isActive(): boolean {
    return this.id === this.dbServerStore.activeDbServerId;
  }

  @computed
  get link() {
    return `/connections/${this.id}`;
  }

  @computed
  get treeViewFilter() {
    return this.dbServerStore.databaseTreeViewFilter(this.id);
  }

  @action
  setTreeViewFilter(filter: string) {
    this.dbServerStore.setDatabaseTreeViewFilter(this.id, filter);
  }

  @computed
  get props(): DbServerProps {
    return {
      id: this.id,
      name: this.name,
      db_type: this.dbType,
      host: this.host,
      port: this.port,
      username: this.username,
      initial_db: this.initDb,
      initial_table: this.initTable,
      query_count: this.queryCount,
      database_schema_query_id: this.databaseSchemaQueryId,
      error_query_count: this.errorQueryCount,
      created_at: this.createdAt.toISOString(),
      updated_at: this.updatedAt.toISOString()
    };
  }

  @computed
  get params() {
    const connection: UpdateProps = {
      id: this.id,
      name: this.name,
      db_type: this.dbType,
      host: this.host,
      port: this.port,
      username: this.username,
      initial_db: this.initDb,
      initial_table: this.initTable,
      database_schema_query_id: this.databaseSchemaQueryId
    };
    if (this.password) {
      connection.password = this.password;
    }
    return connection;
  }

  @computed
  get schemaQuery(): SchemaQuery | undefined {
    return this.schemaQueryStore.find(this.databaseSchemaQueryId);
  }

  @action
  useDefaultSchemaQuery() {
    this.close();
    this.databaseSchemaQueryId = this.schemaQueryStore.default(this.dbType).id;
    this.save().then(() => {
      this.dbServerStore.routeToDbServer(this.id);
    });
  }

  @action
  save(): Promise<void> {
    return this.dbServerStore.updateDbServer(this);
  }

  @computed
  get databaseNames(): string[] {
    return this.dbServerStore.databaseNames(this.id);
  }

  @computed
  get loadedDatabases(): Database[] {
    return this.dbServerStore.loadedDatabases(this.id);
  }

  @action
  reload() {
    this.dbServerStore.reloadDbServer(this.id);
  }

  @action
  reloadDatabase(name: string) {
    this.dbServerStore.reloadDatabase(this.id, name);
  }

  database(dbName: string): Database | undefined {
    return this.dbServerStore.database(this.id, dbName);
  }

  @computed
  get initialTable(): DbTable | undefined {
    if (!this.initDb || !this.initTable) {
      return;
    }
    return this.database(this.initDb)?.schemas[0]?.tables?.find((t) => t.name === this.initTable);
  }

  @computed
  get queries(): Query[] {
    return this.dbServerStore.queries(this.id);
  }

  @computed
  get activeDatabaseName(): string | undefined {
    return this.dbServerStore.activeDatabaseName(this.id);
  }

  /**
   * unique key that is unique per database. Can be used to trigger reactions
   * when the database changes.
   * @returns [string | undefined]
   */
  @computed
  get activeDatabaseKey(): string | undefined {
    return `${this.id}/${this.dbServerStore.activeDatabaseName(this.id)}`;
  }

  @computed
  get activeDatabase(): Database | undefined {
    if (!this.activeDatabaseName) {
      return;
    }
    return this.dbServerStore.database(this.id, this.activeDatabaseName);
  }

  @action
  setActiveDatabase(dbName: string) {
    this.dbServerStore.setActiveDatabase(this.id, dbName);
  }

  // @return [string] the initial database or the first database of the index
  @computed
  get defaultDatabaseName(): string | undefined {
    if (this.initDb) {
      return this.initDb;
    }

    const dbNames = this.databaseNames;
    if (dbNames.length > 0) {
      return dbNames[dbNames.length - 1];
    }
  }

  @action
  close() {
    this.dbServerStore.closeDbServer(this.id);
  }
}
