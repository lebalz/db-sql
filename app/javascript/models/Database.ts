import { observable, computed, action } from 'mobx';
import { Database as DatabaseProps, tables } from '../api/db_connection';
import _ from 'lodash';
import DbConnection, { QueryState } from './DbConnection';
import DbTable from './DbTable';

export default class Database {
  readonly dbConnection: DbConnection;
  readonly name: string;
  tables = observable<DbTable>([]);
  @observable queryState: QueryState= QueryState.None;

  constructor(dbConnection: DbConnection, props: DatabaseProps) {
    this.dbConnection = dbConnection;
    this.name = props.name;
  }

  @computed get id() {
    return this.dbConnection.id;
  }

  @action load() {
    this.queryState = QueryState.Executing;
    (tables(this.id, this.name)).then(
      ({ data }) => {
        this.tables.replace(data.map(table => new DbTable(this, table)));
        this.queryState = QueryState.Success;
      }
    ).catch((e) => {
      this.queryState = QueryState.Error;
    });
  }

}
