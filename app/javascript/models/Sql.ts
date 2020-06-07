import { observable, computed } from 'mobx';
import Database from './Database';

export default class Sql {
  database: Database | undefined = undefined;

  @observable query: string = '';
  run() {}
  onSqlChange(value: string) {
    this.query = value;
  }
  get name(): string {
    return '';
  }

  get databaseType(): 'sql' | 'mysql' | 'pgsql' {
    return 'sql';
  }
}
