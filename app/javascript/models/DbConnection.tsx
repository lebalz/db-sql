import { observable, computed } from 'mobx';
import { DbConnection as DbConnectionProps } from '../api/db_connection';
import _ from 'lodash';
import User from './User';

export enum DbType {
  Psql = 'psql',
  MySql = 'mysql'
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
}
