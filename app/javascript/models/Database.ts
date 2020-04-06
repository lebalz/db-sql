import { observable, computed, action, reaction } from 'mobx';
import { Database as DatabaseProps, query as fetchQuery } from '../api/db_server';
import _ from 'lodash';
import DbServer from './DbServer';
import DbTable from './DbTable';
import { REST } from '../declarations/REST';
import Query from './Query';
import DbServerStore from '../stores/db_server_store';

export default class Database {
  readonly dbServer: DbServer;
  readonly name: string;
  readonly dbServerId: string;
  readonly tables: DbTable[];
  queries = observable<Query>([new Query(this, 1)]);
  @observable activeQueryId: number = 1;

  @observable show: boolean = false;

  constructor(dbServer: DbServer, props: DatabaseProps) {
    this.dbServer = dbServer;
    this.name = props.name;
    this.dbServerId = props.db_server_id;
    this.tables = props.tables.map((table) => new DbTable(this, table));
    this.connectForeignKeys();
  }

  @action
  setActiveQuery(id: number) {
    this.activeQueryId = id;
  }

  @computed
  get activeQuery() {
    return this.queries.find((query) => query.id === this.activeQueryId);
  }

  table(name: string): DbTable | undefined {
    return this.tables.find((table) => table.name === name);
  }

  @action
  toggleShow() {
    this.show = !this.show;
  }

  @action
  setShow(show: boolean) {
    this.show = show;
  }

  @computed
  get isActive(): boolean {
    return this.name === this.dbServer.activeDatabaseName && this.dbServer.isActive;
  }

  executeQuery() {
    const activeQuery = this.activeQuery;
    if (!activeQuery) {
      return;
    }
    activeQuery.run();
  }

  @action
  setDefaultQueryActive() {
    if (this.queries.length > 0) {
      const lastQuery = this.queries[this.queries.length - 1];
      this.setActiveQuery(lastQuery.id);
    }
  }

  @action
  removeQuery(query: Query) {
    if (this.queries.remove(query)) {
      query.cancel();
      this.setDefaultQueryActive();
    }
  }

  private connectForeignKeys() {
    this.tables.forEach((table) => {
      table.foreignKeys.forEach((fkey) => {
        const fromColumn = table.column(fkey.options.column);
        const toTable = this.table(fkey.to_table);
        const toColumn = toTable?.column(fkey.options.primary_key);
        if (!toColumn || !toTable || !fromColumn) {
          return;
        }
        fromColumn.references = toColumn;
        toColumn.referencedBy.push(fromColumn);
      });
    });
  }
}
