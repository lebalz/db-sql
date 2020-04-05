import { observable, computed, action, reaction } from 'mobx';
import { Database as DatabaseProps, QueryResult } from '../api/db_server';
import _ from 'lodash';
import DbServer from './DbServer';
import DbTable from './DbTable';
import { REST } from '../declarations/REST';
import Query from './Query';
import DatabaseStore from '../stores/database_store';

export default class Database {
  readonly databaseStore: DatabaseStore;
  readonly name: string;
  readonly dbServerId: string;
  readonly tables: DbTable[];
  @observable activeQuery: Query = new Query(this, 1);
  @observable show: boolean = false;

  constructor(databaseStore: DatabaseStore, props: DatabaseProps) {
    this.databaseStore = databaseStore;
    this.name = props.name;
    this.dbServerId = props.db_server_id;
    this.tables = props.tables.map((table) => new DbTable(this, table));
    this.connectForeignKeys();
  }

  table(name: string): DbTable | undefined {
    return this.tables.find((table) => table.name === name);
  }

  // @computed get foreignKeyReferences(): ForeignKey[] {
  //   return this.tables.reduce((fkeys, table) => {
  //     return [
  //       ...fkeys,
  //       ...table.columns.filter((col) => col.isForeignKey).map((col) => col.foreignKey!),
  //     ];
  //   }, Array<ForeignKey>());
  // }

  @action
  toggleShow() {
    this.show = !this.show;
  }

  private connectForeignKeys() {
    this.tables.forEach((table) => {
      table.foreignKeys.forEach((fkey) => {
        const fromColumn = table.column(fkey.options.column);
        const toTable = this.table(fkey.to_table);
        const toColumn = toTable?.column(fkey.options.primary_key);
        if (!toColumn || !toTable || !fromColumn) {
          return;
        }
        fromColumn.references = toColumn;
        toColumn.referencedBy.push(fromColumn);
      });
    });
  }
}
