import { observable, computed, action } from 'mobx';
import { Database as DatabaseProps, tables } from '../api/db_connection';
import _ from 'lodash';
import DbConnection, { QueryState } from './DbConnection';
import DbTable from './DbTable';

export default class Database {
  readonly dbConnection: DbConnection;
  readonly name: string;
  tables = observable<DbTable>([]);
  @observable queryState: QueryState = QueryState.None;
  @observable isLoaded: boolean | null = false;

  constructor(dbConnection: DbConnection, props: DatabaseProps) {
    this.dbConnection = dbConnection;
    this.name = props.name;
  }

  @computed get id() {
    return this.dbConnection.id;
  }

  @action load(forceLoad: boolean = false) {
    if (this.isLoaded && !forceLoad) {
      return;
    }
    this.isLoaded = null;
    tables(this.id, this.name).then(
      ({ data }) => {
        this.tables.replace(data.map(table => new DbTable(this, table)));
        this.isLoaded = true;
      }
    ).catch((e) => {
      this.isLoaded = false;
    });
  }

}
