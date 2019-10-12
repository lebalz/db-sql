import { observable, computed, action, reaction } from 'mobx';
import {
  DbTable as DbTableProps,
  columns as fetchColumns,
  foreignKeys as fetchForeignKeys,
  indexes as fetchIndexes,
  IndexProps
} from '../api/db_connection';
import _ from 'lodash';
import { QueryState } from './DbConnection';
import Database from './Database';
import DbColumn from './DbColumn';
import ForeignKey from './ForeignKey';

export default class DbTable {
  readonly database: Database;
  readonly name: string;
  columns = observable<DbColumn>([]);
  foreignKeys = observable<ForeignKey>([]);
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

  @computed get highlight() {
    return this.columns.some(c => c.highlight);
  }

  @action toggleShow() {
    this.show = !this.show;
  }

  @computed get id() {
    return this.database.id;
  }

  column(name: string): DbColumn | undefined {
    return this.columns.find(c => c.name === name);
  }

  @action load(forceLoad: boolean = false) {
    if (this.isLoaded && !forceLoad) {
      return;
    }

    return this.loadColumns().then(() => {
      Promise.resolve([
        this.loadForeignKeys(),
        this.loadIndexes()
      ]).then(() => {
        this.isLoaded = true;
      }).catch((e) => {
        this.isLoaded = false;
      });
    });
  }

    @action loadColumns() {
      return fetchColumns(this.id, this.database.name, this.name).then(
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

    @action loadForeignKeys() {
      return fetchForeignKeys(this.id, this.database.name, this.name).then(
        ({ data }) => {
          this.foreignKeys.replace(data.map(fk => new ForeignKey(this.database, fk)));
        }
      ).catch((e) => {
        console.log('Could not load foreign keys: ', e);
      });
    }

    @action loadIndexes() {
      return fetchIndexes(this.id, this.database.name, this.name).then(
        ({ data }) => {
          this.indexex.replace(data);
        }
      ).catch((e) => {
        console.log('Could not load indexes: ', e);
      });
    }
  }
