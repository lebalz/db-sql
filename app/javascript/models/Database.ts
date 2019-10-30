import { observable, computed, action, reaction } from 'mobx';
import { Database as DatabaseProps, tables } from '../api/db_connection';
import _ from 'lodash';
import DbConnection, { QueryState } from './DbConnection';
import DbTable from './DbTable';
import ForeignKey from './ForeignKey';
import { REST } from '../declarations/REST';

export default class Database {
  readonly dbConnection: DbConnection;
  readonly name: string;
  tables = observable<DbTable>([]);
  @observable requestState: REST = REST.None;
  @observable show: boolean = false;
  @observable result: { [key: string]: string | number }[] = [];

  constructor(dbConnection: DbConnection, props: DatabaseProps) {
    this.dbConnection = dbConnection;
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
    return this.dbConnection.id;
  }

  @computed get foreignKeyReferences(): ForeignKey[] {
    return this.tables.reduce((fks, table) => {
      return [
        ...fks,
        ...table.columns
          .filter(col => col.isForeignKey)
          .map(col => col.foreignKey!)
      ];
    }, Array<ForeignKey>());
  }

  @computed get isLoaded() {
    return this.requestState === REST.Success && this.tables.every(t => t.isLoaded);
  }

  @computed get hasPendingRequest() {
    return this.requestState === REST.Requested || this.tables.some(t => t.hasPendingRequest);
  }

  @action load(forceLoad: boolean = false) {
    if (this.isLoaded && !forceLoad) {
      return;
    }
    this.requestState = REST.Requested;
    tables(this.id, this.name).then(
      ({ data }) => {
        this.tables.replace(data.map(table => new DbTable(this, table)));
        this.requestState = REST.Success;
      }
    ).then(() => this.tables.forEach(t => t.load())
    ).catch((e) => {
      this.requestState = REST.Error;
    });
  }

  table(name: string): DbTable | undefined {
    return this.tables.find(t => t.name === name);
  }

}
