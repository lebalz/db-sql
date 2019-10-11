import { computed } from 'mobx';
import _ from 'lodash';
import DbTable from './DbTable';
import { SqlTypeMetadata, ColumnProps } from '../api/db_connection';

export default class DbColumn {
  readonly table: DbTable;
  readonly name: string;
  readonly collation: string;
  readonly default: string;
  readonly defaultFunction: string;
  readonly isNull: boolean;
  readonly isSerial: boolean;
  readonly sqlTypeMetadata: SqlTypeMetadata;
  constructor(table: DbTable, props: ColumnProps) {
    this.table = table;

    this.name = props.name;
    this.collation = props.collation;
    this.default = props.default;
    this.defaultFunction = props.default_function;
    this.isNull = props.null;
    this.isSerial = props.serial;
    this.sqlTypeMetadata = props.sql_type_metadata;
  }

  @computed get isPrimaryKey() {
    return this.table.primaryKeyNames.includes(this.name);
  }

  @computed get isForeignKey() {
    return this.table.foreignKeyColumnNames.includes(this.name);
  }

}
