import { computed, observable } from 'mobx';
import _ from 'lodash';
import DbTable from './DbTable';
import { ForeignKeyProps } from '../api/db_connection';
import Database from './Database';

export default class ForeignKey {
  readonly database: Database;
  readonly toColumnName: string;
  readonly fromColumnName: string;
  readonly name: string;
  @observable toTable: DbTable;
  @observable fromTable: DbTable;

  constructor(database: Database, props: ForeignKeyProps) {
    this.database = database;
    this.fromTable = this.database.table(props.from_table)!;
    this.toTable = this.database.table(props.to_table)!;
    this.fromColumnName = props.options.column;
    this.toColumnName = props.options.primary_key;
    this.name = props.options.name;

    this.fromColumn.foreignKey = this;
  }

  @computed get fromColumn() {
    return this.fromTable.columns.find(c => c.name === this.fromColumnName)!;
  }

  @computed get toColumn() {
    console.log(this.toTable.name);
    return this.toTable.columns.find(c => c.name === this.toColumnName);
  }
}
