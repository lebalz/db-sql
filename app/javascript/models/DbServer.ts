import { observable, computed, action } from 'mobx';
import { DbServer as DbServerProps, databases } from '../api/db_server';
import _ from 'lodash';
import Database from './Database';
import { REST } from '../declarations/REST';
import { CancelTokenSource } from 'axios';
import DbServerStore from '../stores/db_server_store';
import Query from './Query';

export enum DbType {
  Psql = 'psql',
  MySql = 'mysql',
}

export enum QueryState {
  None,
  Executing,
  Success,
  Error,
}

export interface UpdateProps extends Partial<DbServerProps> {
  id: string;
  password?: string;
}

export default class DbServer {
  private readonly dbServerStore: DbServerStore;
  readonly id: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  @observable name: string;
  @observable dbType: DbType;
  @observable host: string;
  @observable port: number;
  @observable username: string;
  @observable initialDb?: string;
  @observable initialTable?: string;
  @observable password?: string;
  @observable queryState: QueryState = QueryState.None;

  @observable dbRequestState: REST = REST.None;
  cancelToken: CancelTokenSource;

  constructor(
    props: DbServerProps,
    dbServerStore: DbServerStore,
    cancelToken: CancelTokenSource
  ) {
    this.dbServerStore = dbServerStore;
    this.id = props.id;
    this.name = props.name;
    this.dbType = props.db_type;
    this.host = props.host;
    this.port = props.port;
    this.username = props.username;
    this.initialDb = props.initial_db;
    this.initialTable = props.initial_table;
    this.createdAt = new Date(props.created_at);
    this.updatedAt = new Date(props.updated_at);
    this.cancelToken = cancelToken;
  }

  static formatDate(date: Date) {
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
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
  get props(): DbServerProps {
    return {
      id: this.id,
      name: this.name,
      db_type: this.dbType,
      host: this.host,
      port: this.port,
      username: this.username,
      initial_db: this.initialDb,
      initial_table: this.initialTable,
      created_at: this.createdAt.toISOString(),
      updated_at: this.updatedAt.toISOString(),
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
      initial_db: this.initialDb,
      initial_table: this.initialTable,
    };
    if (this.password) {
      connection.password = this.password;
    }
    return connection;
  }

  @computed
  get databaseNames(): string[] {
    return this.dbServerStore.databaseNames(this.id);
  }

  @computed
  get loadedDatabases(): Database[] {
    return this.dbServerStore.loadedDatabases(this.id);
  }

  database(dbName: string): Database | undefined {
    return this.dbServerStore.database(this.id, dbName);
  }

  @computed
  get queries(): Query[] {
    return this.dbServerStore.queries(this.id);
  }

  @computed
  get activeDatabaseName(): string | undefined {
    return this.dbServerStore.activeDatabaseName(this.id);
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
    if (this.initialDb) {
      return this.initialDb;
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
