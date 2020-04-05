import { computed, observable, action } from 'mobx';
import _ from 'lodash';
import DbTable from './DbTable';
import { SqlTypeMetadata, Column as ColumnProps } from '../api/db_server';
import Database from './Database';

export enum Mark {
  From = 'from',
  To = 'to',
  None = 'none'
}
export default class DbColumn {
  readonly table: DbTable;
  readonly name: string;
  readonly collation: string;
  readonly default: string;
  readonly defaultFunction: string;
  readonly isNull: boolean;
  readonly isSerial: boolean;
  readonly isPrimaryKey: boolean;
  readonly sqlTypeMetadata: SqlTypeMetadata;
  references?: DbColumn = undefined;
  referencedBy: DbColumn[] = [];

  @observable mark: Mark = Mark.None;

  constructor(table: DbTable, props: ColumnProps) {
    this.table = table;
    this.name = props.name;
    this.collation = props.collation;
    this.default = props.default;
    this.defaultFunction = props.default_function;
    this.isNull = props.null;
    this.isSerial = props.serial;
    this.sqlTypeMetadata = props.sql_type_metadata;
    this.isPrimaryKey = props.is_primary;
  }

  get isForeignKey() {
    return !!this.references;
  }

  get foreignColumn(): DbColumn | undefined {
    return this.references;
  }

  get foreignTable(): DbTable | undefined {
    return this.references?.table;
  }

  // get referencedBy(): DbColumn[] {
  //   return this.table.database.foreignKeyReferences
  //   .filter(fk => fk.toColumn === this)
  //   .map(fk => fk.fromColumn);
  // }

}
