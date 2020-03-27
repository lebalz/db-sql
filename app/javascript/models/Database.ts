import { observable, computed, action, reaction } from 'mobx';
import { Database as DatabaseProps, tables, QueryResult } from '../api/db_connection';
import _ from 'lodash';
import DbConnection from './DbConnection';
import DbTable from './DbTable';
import ForeignKey from './ForeignKey';
import { REST } from '../declarations/REST';
import Query from './Query';

export default class Database {
  readonly dbConnection: DbConnection;
  readonly name: string;
  tables = observable<DbTable>([]);
  @observable requestState: REST = REST.None;
  @observable show: boolean = false;
  queries = observable<Query>([]);

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

  @computed
  get isActive() {
    return this.dbConnection.activeDatabase === this;
  }

  @computed
  get lastQuery(): Query | undefined {
    return this.query(this.queries.length - 1);
  }

  @computed
  get activeQuery(): Query | undefined {
    return this.queries.find((query) => query.isActive);
  }

  query(id: number): Query | undefined {
    return this.queries[id];
  }

  @action addQuery(): Query {
    const query = new Query(this, this.queries.length + 1);
    this.queries.push(query);
    return query;
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
        ...table.columns.filter((col) => col.isForeignKey).map((col) => col.foreignKey!)
      ];
    }, Array<ForeignKey>());
  }

  @computed get isLoaded() {
    return this.requestState === REST.Success && this.tables.every((t) => t.isLoaded);
  }

  @computed get hasPendingRequest() {
    return (
      this.requestState === REST.Requested || this.tables.some((t) => t.hasPendingRequest)
    );
  }

  @action load(forceLoad: boolean = false) {
    if (this.isLoaded && !forceLoad) {
      return;
    }
    this.queries.replace([]);
    this.requestState = REST.Requested;
    const query = this.addQuery();
    query.setActive();
    tables(this.id, this.name)
      .then(({ data }) => {
        this.tables.replace(data.map((table) => new DbTable(this, table)));
        this.requestState = REST.Success;
      })
      .then(() => this.tables.forEach((t) => t.load()))
      .catch((e) => {
        this.requestState = REST.Error;
      });
  }

  table(name: string): DbTable | undefined {
    return this.tables.find((t) => t.name === name);
  }
}
