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
import DbColumn, { Mark } from './DbColumn';
import ForeignKey from './ForeignKey';
import { REST } from '../declarations/REST';

interface RequestState {
  columns: REST;
  foreignKeys: REST;
  indexes: REST;
}
export default class DbTable {
  readonly database: Database;
  readonly name: string;
  columns = observable<DbColumn>([]);
  foreignKeys = observable<ForeignKey>([]);
  indexex = observable<IndexProps>([]);
  @observable queryState: QueryState = QueryState.None;
  requestStates: RequestState = observable({
    columns: REST.None,
    foreignKeys: REST.None,
    indexes: REST.None
  });
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

  @computed get mark(): Mark {
    const col = this.columns.find(c => c.mark === Mark.To || c.mark === Mark.From);
    return col ? col.mark : Mark.None;
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

  @computed get hasPendingRequest(): boolean {
    return Object.values(this.requestStates).some(state => state === REST.Requested);
  }

  @computed get isLoaded(): boolean {
    return Object.values(this.requestStates).every(state => state === REST.Success);
  }

  @action setRequestState(state: REST) {
    this.requestStates.columns = state;
    this.requestStates.foreignKeys = state;
    this.requestStates.indexes = state;
  }

  @action load(forceLoad: boolean = false) {
    if (this.isLoaded && !forceLoad) {
      return;
    }
    this.setRequestState(REST.None);
    return this.loadColumns().then(() => {
      Promise.resolve([
        this.loadForeignKeys(),
        this.loadIndexes()
      ]);
    });
  }

  @action loadColumns() {
    this.requestStates.columns = REST.Requested;
    return fetchColumns(this.id, this.database.name, this.name).then(
      ({ data }) => {
        this.columns.replace(
          data.map(col => new DbColumn(this, col))
        );
        this.requestStates.columns = REST.Success;
      }
    ).catch((e) => {
      this.requestStates.columns = REST.Error;
    });
  }

  @action loadForeignKeys() {
    this.requestStates.foreignKeys = REST.Requested;
    return fetchForeignKeys(this.id, this.database.name, this.name).then(
      ({ data }) => {
        this.foreignKeys.replace(data.map(fk => new ForeignKey(this.database, fk)));
        this.requestStates.foreignKeys = REST.Success;
      }
    ).catch((e) => {
      this.requestStates.foreignKeys = REST.Error;
      console.log('Could not load foreign keys: ', e);
    });
  }

  @action loadIndexes() {
    this.requestStates.indexes = REST.Requested;
    return fetchIndexes(this.id, this.database.name, this.name).then(
      ({ data }) => {
        this.indexex.replace(data);
        this.requestStates.indexes = REST.Success;
      }
    ).catch((e) => {
        this.requestStates.indexes = REST.Error;
        console.log('Could not load indexes: ', e);
    });
  }
}
