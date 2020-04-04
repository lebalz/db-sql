import { observable, computed, action } from 'mobx';
import { REST } from '../declarations/REST';
import { QueryResult } from '../api/db_server';
import Database from './Database';

export default class Query {
  private readonly database: Database;
  readonly id: number;
  @observable requestState: REST = REST.None;
  @observable query: string = '';
  @observable results: QueryResult[] = [];
  @observable active: boolean = false;

  constructor(database: Database, id: number) {
    this.database = database;
    this.id = id;
  }

  @computed
  get name() {
    if (this.id === 1) {
      return this.database.name;
    }
    return `${this.database}#${this.id}`;
  }

  @computed
  get isActive() {
    if (!this.database.isActive) {
      return false;
    }

    return this.active;
  }

  @action
  close() {
    this.database.queries.remove(this);
    this.database.lastQuery?.setActive();
  }

  @action
  setInactive() {
    this.active = false;
  }

  @action
  setActive() {
    this.database.activeQuery?.setInactive();
    this.active = true;
  }
}
