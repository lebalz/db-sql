import { computed, observable, action } from 'mobx';
import _ from 'lodash';
import DbTable from './DbTable';
import { SqlTypeMetadata, ColumnProps } from '../api/db_connection';
import ForeignKey from './ForeignKey';

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
  @observable isPrimary: boolean = false;
  @observable foreignKey?: ForeignKey = undefined;
  @observable highlight: boolean = false;
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

  @computed get isForeignKey() {
    return !!this.foreignKey;
  }

  @computed get foreignColumn(): DbColumn | undefined {
    return this.foreignKey && this.foreignKey.toColumn;
  }

  @computed get foreignTable(): DbTable | undefined {
    return this.foreignKey && this.foreignKey.toTable;
  }

}
