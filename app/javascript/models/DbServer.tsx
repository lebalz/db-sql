import { observable, computed, action } from 'mobx';
import { DbServer as DbServerProps, databases } from '../api/db_server';
import _ from 'lodash';
import Database from './Database';
import { REST } from '../declarations/REST';
import { CancelTokenSource } from 'axios';

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
  @observable activeDatabase?: Database = undefined;
  databases = observable<Database>([]);

  @observable dbRequestState: REST = REST.None;
  cancelToken: CancelTokenSource;

  constructor(props: DbServerProps, cancelToken: CancelTokenSource) {
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

  @action close() {
    if (this.dbRequestState === REST.Requested) {
      return false;
    }
    this.dbRequestState = REST.None;
    this.databases.clear();
  }

  @computed get isLoaded() {
    return this.dbRequestState === REST.Success;
  }

  @computed get isClosed() {
    return this.dbRequestState === REST.None;
  }

  @action loadDatabases(forceLoad: boolean = false) {
    if (this.isLoaded && !forceLoad) {
      return;
    }
    this.dbRequestState = REST.Requested;
    databases(this.id, this.cancelToken)
      .then(({ data }) => {
        this.databases.replace(data.map((db) => new Database(this, db)));
        this.dbRequestState = REST.Success;
      })
      .then(() => {
        const initDb = this.databases.find((db) => db.name === this.initialDb);
        this.activeDatabase = initDb || this.databases[0];
        if (this.activeDatabase) {
          this.activeDatabase.show = true;
        }
      })
      .catch((e) => {
        this.databases.replace([]);
        this.dbRequestState = REST.Error;
      });
  }

  @computed get props(): DbServerProps {
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
      updated_at: this.updatedAt.toISOString()
    };
  }

  @computed get params() {
    const connection: UpdateProps = {
      id: this.id,
      name: this.name,
      db_type: this.dbType,
      host: this.host,
      port: this.port,
      username: this.username,
      initial_db: this.initialDb,
      initial_table: this.initialTable
    };
    if (this.password) {
      connection.password = this.password;
    }
    return connection;
  }
}
