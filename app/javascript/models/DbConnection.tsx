import { observable, computed, action } from 'mobx';
import { DbConnection as DbConnectionProps, dbConnectionPassword, databaseNames } from '../api/db_connection';
import _ from 'lodash';
import User from './User';

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
  @observable initialSchema?: string;
  @observable password?: string;
  @observable valid?: boolean;
  @observable queryState: QueryState = QueryState.None;

  constructor(props: DbConnectionProps) {
    this.id = props.id;
    this.name = props.name;
    this.dbType = props.db_type;
    this.host = props.host;
    this.port = props.port;
    this.username = props.username;
    this.initialDb = props.initial_db;
    this.initialSchema = props.initial_schema;
    this.createdAt = new Date(props.created_at);
    this.updatedAt = new Date(props.updated_at);
  }

  static formatDate(date: Date) {
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  }

  @action loadPassword() {
    dbConnectionPassword(this.id).then(
      ({ data }) => {
        this.password = data.password;
      }
    );
  }

  @action testConnection() {
    this.queryState = QueryState.Executing;
    databaseNames(this.id).then(
      ({ data }) => {
        console.log(data.join(', '));
        this.valid = true;
      this.queryState = QueryState.Success;
    }
    ).catch((e) => {
      this.valid = false;
      this.queryState = QueryState.Error;
    });
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
      initial_schema: this.initialSchema,
    };
    if (this.password) {
      connection.password = this.password;
    }
    return connection;
  }
}
