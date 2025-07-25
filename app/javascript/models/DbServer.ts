import { observable, computed, action, runInAction } from 'mobx';
import { DbServer as DbServerProps, OwnerType } from '../api/db_server';
import _ from 'lodash';
import Database from './Database';
import { REST } from '../declarations/REST';
import { CancelTokenSource } from 'axios';
import DbServerStore from '../stores/db_server_store';
import QueryEditor from './QueryEditor';
import DbTable from './DbTable';
import SchemaQuery from './SchemaQuery';
import SchemaQueryStore from '../stores/schema_query_store';
import { string } from 'prop-types';

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

const DB_CONNECTION_URI_REGEX = /^(?<type>(postgres(ql)?|mysql)):\/\/(?<user>\w+)?(?<password>:[^@]+@)?(?<host>[a-zA-Z-_.]+)?(?<port>:\d+)?(?<db>\/\w+)?/i


export const DEFAULT_DB_SERVER: DbServerProps = {
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  default_sql_limit: 500,
  owner_type: OwnerType.User,
  owner_id: '',
  db_type: DbType.Psql,
  host: '',
  id: '',
  name: '',
  port: 5432,
  username: '',
  query_count: 0,
  database_schema_query_id: '',
  error_query_count: 0
};

export interface UpdateProps extends Partial<DbServerProps> {
  id: string;
  password?: string;
}

export default class DbServer {
  private readonly dbServerStore: DbServerStore;
  protected readonly schemaQueryStore: SchemaQueryStore;
  readonly id: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  @observable queryCount: number;
  @observable errorQueryCount: number;
  @observable name: string;
  @observable dbType: DbType;
  @observable defaultSqlLimit: number;
  @observable host: string;
  @observable port: number;
  @observable username: string;
  @observable initDb?: string;
  @observable initTable?: string;
  @observable password?: string;
  @observable databaseSchemaQueryId: string;
  @observable queryState: QueryState = QueryState.None;
  @observable ownerType: OwnerType;
  @observable ownerId: string;
  @observable connectionError?: string;

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
    this.ownerType = props.owner_type;
    this.ownerId = props.owner_id;
    this.dbType = props.db_type;
    this.defaultSqlLimit = props.default_sql_limit;
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

  newEditor(database: Database, queryId: number) {
    return this.dbServerStore.requestQueryEditor(database, queryId);
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
      owner_type: this.ownerType,
      owner_id: this.ownerId,
      db_type: this.dbType,
      default_sql_limit: this.defaultSqlLimit,
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
      default_sql_limit: this.defaultSqlLimit,
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
      this.dbServerStore.routeToDbServer(this.id, { replace: true });
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

  @computed
  get isOutdated(): boolean {
    return (this.connectionError ?? '').length > 0 || this.dbServerStore.isOutdated(this.id);
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
  get queries(): QueryEditor[] {
    return this.dbServerStore.queries(this.id);
  }

  @computed
  get activeDatabaseName(): string | undefined {
    return this.dbServerStore.activeDatabaseName(this.id);
  }

  @computed
  get connectionString(): string {
    const protocol = this.dbType === DbType.Psql ? 'postgresql' : 'mysql';
    const pw = this.password ? `:${this.password}` : '';
    const db = this.initDb ? `/${this.initDb}` : '';
    this.initTable
    return `${protocol}://${this.username}${pw}@${this.host || 'localhost'}:${this.port}${db}`;
  }

  @action
  setConnectionString(cString: string) {
    if (!DB_CONNECTION_URI_REGEX.test(cString)) {
      return;
    }
    const match = cString.match(DB_CONNECTION_URI_REGEX);
    if (!match?.groups) {
      return;
    }
    const groups = match.groups as {type: 'postgres' | 'postgresql' | 'mysql', user?: string, password?: string, host?: string, port?: string, db?: string};
    console.log(groups)
    this.dbType = groups.type === 'mysql' ? DbType.MySql : DbType.Psql;
    this.username = groups.user || '';
    this.password = groups.password?.slice(1, -1) || undefined;
    this.host = groups.host || '';
    this.port = parseInt(groups.port?.slice(1) || (this.dbType === DbType.Psql ? '5432' : '3306'), 10);
    this.initDb = groups.db?.slice(1) || undefined;
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
  show(dbName?: string) {
    this.dbServerStore.routeToDbServer(this.id, { dbName: dbName });
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
  edit() {
    this.dbServerStore.editDbServer(this.id);
  }

  @action
  close() {
    this.dbServerStore.closeDbServer(this.id);
  }
}
