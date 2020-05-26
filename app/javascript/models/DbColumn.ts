import { observable, action } from 'mobx';
import _ from 'lodash';
import DbTable from './DbTable';
import { SqlTypeMetadata, Column as ColumnProps, Constraint, ReferenceConstraint } from '../api/db_server';
import Database from './Database';

export enum Mark {
  From = 'from',
  To = 'to',
  None = 'none'
}
export default class DbColumn {
  readonly table: DbTable;
  readonly name: string;
  readonly default: string;
  readonly isNull: boolean;
  readonly isPrimaryKey: boolean;
  readonly sqlTypeMetadata: SqlTypeMetadata;
  readonly constraints: (Constraint | ReferenceConstraint)[];
  references?: DbColumn = undefined;
  referencedBy: DbColumn[] = [];

  @observable mark: Mark = Mark.None;

  constructor(table: DbTable, name: string, props: ColumnProps) {
    this.table = table;
    this.name = name;
    this.default = props.default;
    this.isNull = props.null;
    this.sqlTypeMetadata = props.sql_type_metadata;
    this.isPrimaryKey = props.is_primary;
    this.constraints = props.constraints;
  }

  @action
  linkForeignKeys(db: Database) {
    this.foreignConstraints.forEach((fc) => {
      const ref = db.find(fc.schema, fc.table, fc.column);
      if (ref) {
        ref.referencedBy.push(this);
        this.references = ref;
      }
    });
  }

  get foreignConstraints(): ReferenceConstraint[] {
    return this.constraints.filter((constraint) => !!constraint.schema) as ReferenceConstraint[];
  }

  get locationName(): string {
    return `${this.table.name}#${this.name}`;
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
}
