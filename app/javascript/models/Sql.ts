import { observable, computed } from 'mobx';
import Database from './Database';
import { AceSqlType } from '../components/DatabaseServer/Query/SqlEditor';

export default class Sql {
  database?: Database;

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

  get databaseType(): AceSqlType {
    return 'sql';
  }
}
