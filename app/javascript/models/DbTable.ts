import { observable, computed, action, reaction } from 'mobx';
import {
  DbTable as DbTableProps,
  columns as fetchColumns,
  primaryKeyNames,
  foreignKeys as fetchForeignKeys,
  indexes as fetchIndexes,
  ColumnProps,
  ForeignKeyProps,
  IndexProps
} from '../api/db_connection';
import _ from 'lodash';
import { QueryState } from './DbConnection';
import Database from './Database';
import DbColumn from './DbColumn';

export default class DbTable {
  readonly database: Database;
  readonly name: string;
  columns = observable<DbColumn>([]);
  primaryKeyNames = observable<string>([]);
  foreignKeys = observable<ForeignKeyProps>([]);
  indexex = observable<IndexProps>([]);
  @observable queryState: QueryState = QueryState.None;
  @observable columnsLoaded: boolean | null = false;
  @observable isLoaded: boolean | null = false;
  @observable show: boolean = false;

  constructor(database: Database, props: DbTableProps) {
    this.database = database;
    this.name = props.name;

    reaction(
      () => this.show,
      (show: boolean) => {
        if (show) {
          this.load();
        }
      }
    );
  }

  @action toggleShow() {
    this.show = !this.show;
  }

  @computed get id() {
    return this.database.id;
  }

  @computed get foreignKeyColumnNames() {
    return this.foreignKeys.map(fk => fk.options.column)
  }

  @action load(forceLoad: boolean = false) {
    if (this.isLoaded && !forceLoad) {
      return;
    }
    Promise.resolve([
      this.loadColumns(),
      this.loadForeignKeys(),
      this.loadPrimaryKeys(),
      this.loadIndexes()
    ]).then(() => {
      this.isLoaded = null;
    }).catch((e) => {
      this.isLoaded = false;
    });
  }

  @action loadColumns() {
    fetchColumns(this.id, this.database.name, this.name).then(
      ({ data }) => {
        this.columns.replace(
          data.map(col => new DbColumn(this, col))
        );
        this.columnsLoaded = true;
      }
    ).catch((e) => {
      this.columnsLoaded = false;
    });
  }

  @action loadPrimaryKeys() {
    primaryKeyNames(this.id, this.database.name, this.name).then(
      ({ data }) => {
        this.primaryKeyNames.replace(data);
      }
    ).catch((e) => {
      console.log('Could not load primary keys: ', e);
    });
  }

  @action loadForeignKeys() {
    fetchForeignKeys(this.id, this.database.name, this.name).then(
      ({ data }) => {
        this.foreignKeys.replace(data);
      }
    ).catch((e) => {
      console.log('Could not load foreign keys: ', e);
    });
  }

  @action loadIndexes() {
    fetchIndexes(this.id, this.database.name, this.name).then(
      ({ data }) => {
        this.indexex.replace(data);
      }
    ).catch((e) => {
      console.log('Could not load indexes: ', e);
    });
  }
}
