import { observable, computed, action } from 'mobx';
import { DbTable as DbTableProps, Index, Schema } from '../api/db_server';
import _ from 'lodash';
import Database from './Database';
import DbColumn, { Mark } from './DbColumn';
import { REST } from '../declarations/REST';
import DbTable from './DbTable';

interface RequestState {
  columns: REST;
  foreignKeys: REST;
  indexes: REST;
}
export default class DbSchema {
  readonly database: Database;
  readonly name: string;
  readonly tables: DbTable[];
  @observable show: boolean = false;

  constructor(database: Database, schema: Schema) {
    this.database = database;
    this.name = schema.name;
    this.tables = schema.tables.map((table) => new DbTable(this, table));
  }

  @action
  toggleShow() {
    this.show = !this.show;
  }

  @computed get mark(): Mark {
    const table = this.tables.find((t) => t.mark === Mark.To || t.mark === Mark.From);
    return table?.mark ?? Mark.None;
  }


  find(tableName: string, columnName: string): DbColumn
  find(tableName: string, columnName?: string): DbTable
  find(tableName: string, columnName?: string): DbTable | DbColumn | undefined {
    const dbTable = this.tables.find((t) => t.name === tableName);
    if (!columnName) {
      return dbTable;
    }

    return dbTable?.find(columnName);
  }
}
