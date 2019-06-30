import { observable, computed, action } from 'mobx';
import { DbTable as DbTableProps, columns as fetchColumns } from '../api/db_connection';
import _ from 'lodash';
import { QueryState } from './DbConnection';
import Database from './Database';

export default class DbTable {
  readonly database: Database;
  readonly name: string;
  columns = observable<string>([]);
  @observable queryState: QueryState = QueryState.None;
  @observable isLoaded: boolean | null = false;

  constructor(database: Database, props: DbTableProps) {
    this.database = database;
    this.name = props.name;
  }

  @computed get id() {
    return this.database.id;
  }

  @action load(forceLoad: boolean = false) {
    if (this.isLoaded && !forceLoad) {
      return;
    }
    this.isLoaded = null;
    fetchColumns(this.id, this.database.name, this.name).then(
      ({ data }) => {
        this.columns.replace(data.map(table => table.name));
        this.isLoaded = true;
      }
    ).catch((e) => {
      this.isLoaded = false;
    });
  }
}
