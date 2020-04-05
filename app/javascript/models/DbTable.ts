import { observable, computed, action, reaction } from 'mobx';
import {
  DbTable as DbTableProps,
  ForeignKey as ForeignKeyProps,
  Index,
} from '../api/db_server';
import _ from 'lodash';
import { QueryState } from './DbServer';
import Database from './Database';
import DbColumn, { Mark } from './DbColumn';
import { REST } from '../declarations/REST';

interface RequestState {
  columns: REST;
  foreignKeys: REST;
  indexes: REST;
}
export default class DbTable {
  readonly database: Database;
  readonly name: string;
  readonly columns: DbColumn[];
  readonly indices: Index[];
  readonly foreignKeys: ForeignKeyProps[];
  @observable show: boolean = false;

  constructor(database: Database, props: DbTableProps) {
    this.database = database;
    this.name = props.name;
    this.columns = props.columns.map((col) => new DbColumn(this, col));
    this.indices = props.indices;
    this.foreignKeys = props.foreign_keys;
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
