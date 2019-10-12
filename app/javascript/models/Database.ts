import { observable, computed, action, reaction } from 'mobx';
import { Database as DatabaseProps, tables } from '../api/db_connection';
import _ from 'lodash';
import DbConnection, { QueryState } from './DbConnection';
import DbTable from './DbTable';

export default class Database {
  readonly dbConnection: DbConnection;
  readonly name: string;
  tables = observable<DbTable>([]);
  @observable queryState: QueryState = QueryState.None;
  @observable isLoaded: boolean | null = false;
  @observable show: boolean = false;

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

  @action load(forceLoad: boolean = false) {
    if (this.isLoaded && !forceLoad) {
      return;
    }
    this.isLoaded = null;
    tables(this.id, this.name).then(
      ({ data }) => {
        this.tables.replace(data.map(table => new DbTable(this, table)));
        this.isLoaded = true;
      }
    ).then(() => this.tables.forEach(t => t.load())
    ).catch((e) => {
      this.isLoaded = false;
    });
  }

  table(name: string): DbTable | undefined {
    return this.tables.find(t => t.name === name);
  }

}
