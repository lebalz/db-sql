import { observable, computed, action } from 'mobx';
import { DbTable as DbTableProps, Index, Schema, ReferenceConstraint } from '../api/db_server';
import _ from 'lodash';
import Database from './Database';
import DbColumn, { Mark } from './DbColumn';
import { REST } from '../declarations/REST';
import DbSchema from './DbSchema';

interface RequestState {
  columns: REST;
  foreignKeys: REST;
  indexes: REST;
}
export default class DbTable {
  readonly schema: DbSchema;
  readonly name: string;
  readonly columns: DbColumn[];
  @observable show: boolean = false;

  constructor(schema: DbSchema, name: string, table: DbTableProps) {
    this.schema = schema;
    this.name = name;
    this.columns = Object.keys(table).map((name) => new DbColumn(this, name, table[name]));
  }

  get foreignConstraints(): ReferenceConstraint[] {
    return this.columns
      .map((col) => col.foreignConstraints)
      .reduce((prev, fks) => {
        prev.push(...fks);
        return prev;
      }, []);
  }

  find(columnName: string): DbColumn | undefined {
    return this.columns.find((c) => c.name === columnName);
  }

  @action
  toggleShow() {
    this.show = !this.show;
  }

  @computed get mark(): Mark {
    const col = this.columns.find((c) => c.mark === Mark.To || c.mark === Mark.From);
    return col?.mark ?? Mark.None;
  }

  column(name: string): DbColumn | undefined {
    return this.columns.find((c) => c.name === name);
  }
}
