import { computed, observable } from 'mobx';
import _ from 'lodash';
import DbTable from './DbTable';
import { ForeignKeyProps } from '../api/db_connection';
import Database from './Database';
import DbColumn from './DbColumn';

export default class ForeignKey {
  readonly database: Database;
  readonly toColumnName: string;
  readonly fromColumnName: string;
  readonly toTableName: string;
  readonly name: string;
  readonly fromColumn: DbColumn;

  constructor(database: Database, fromColumn: DbColumn, props: ForeignKeyProps) {
    this.database = database;
    this.toTableName = props.to_table;
    this.fromColumnName = props.options.column;
    this.toColumnName = props.options.primary_key;
    this.name = props.options.name;
    this.fromColumn = fromColumn;
  }

  @computed get toTable(): DbTable | undefined {
    return this.database.table(this.toTableName);
  }

  @computed get toColumn() {
    return this.toTable && this.toTable.column(this.toColumnName);
  }
}
