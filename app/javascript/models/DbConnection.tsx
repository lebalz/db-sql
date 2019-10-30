import { observable, computed, action } from 'mobx';
import { DbConnection as DbConnectionProps, databases } from '../api/db_connection';
import _ from 'lodash';
import Database from './Database';
import { REST } from '../declarations/REST';

export enum DbType {
  Psql = 'psql',
  MySql = 'mysql'
}

export enum QueryState {
  None, Executing, Success, Error
}

export interface UpdateProps extends Partial<DbConnectionProps> {
  id: string;
  password?: string;
}

export default class DbConnection {
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

  constructor(props: DbConnectionProps) {
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

  @action loadDatabases(forceLoad: boolean = false) {
    if (this.isLoaded && !forceLoad) {
      return;
    }
    this.dbRequestState = REST.Requested;
    databases(this.id).then(
      ({ data }) => {
        this.databases.replace(data.map(db => new Database(this, db)));
        this.dbRequestState = REST.Success;
      }
    ).catch((e) => {
      this.databases.replace([]);
      this.dbRequestState = REST.Error;
    });
  }

  @computed get props(): DbConnectionProps {
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
      initial_table: this.initialTable,
    };
    if (this.password) {
      connection.password = this.password;
    }
    return connection;
  }
}
