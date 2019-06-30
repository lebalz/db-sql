import { observable } from 'mobx';
import { DbTable as DbTableProps } from '../api/db_connection';
import _ from 'lodash';
import { QueryState } from './DbConnection';
import Database from './Database';

export default class DbTable {
  readonly database: Database;
  readonly name: string;
  columns = observable<string>([]);
  @observable queryState: QueryState = QueryState.None;

  constructor(database: Database, props: DbTableProps) {
    this.database = database;
    this.name = props.name;
  }
}
