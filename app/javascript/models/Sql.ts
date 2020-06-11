import { observable, computed } from 'mobx';
import Database from './Database';

export default class Sql {
  database: Database | undefined = undefined;

  @observable query: string = '';
  @observable lineCount: number = 0;
  run() {}
  onSqlChange(value: string, lineCount: number) {
    this.query = value;
    this.lineCount = lineCount;
  }
  get name(): string {
    return '';
  }

  get databaseType(): 'sql' | 'mysql' | 'pgsql' {
    return 'sql';
  }
}
