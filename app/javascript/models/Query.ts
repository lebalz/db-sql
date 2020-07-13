import { observable, computed, action } from 'mobx';
import { REST } from '../declarations/REST';
import { query as fetchQuery, rawQuery, ResultState } from '../api/db_server';
import Database from './Database';
import axios, { CancelTokenSource } from 'axios';
import { QuerySeparationGrammarLexer } from '../antlr/QuerySeparationGrammarLexer';
import { QuerySeparationGrammarParser } from '../antlr/QuerySeparationGrammarParser';
import { ANTLRInputStream, CommonTokenStream } from 'antlr4ts';
import _ from 'lodash';
import { DbType } from './DbServer';
import Sql from './Sql';
import { ResultType, TableData } from './Result';
import RawResult from './Results/RawResult';
import MultiResult from './Results/MultiResult';

const RAW_QUERY_THRESHOLD = 100;

function identifyCommands(queryText: string) {
  const inputStream = new ANTLRInputStream(queryText);
  const lexer = new QuerySeparationGrammarLexer(inputStream);
  const tokenStream = new CommonTokenStream(lexer);
  const parser = new QuerySeparationGrammarParser(tokenStream);
  const { children } = parser.queriesText();
  if (!children) {
    return [];
  }

  return children.map((child) => child.text.trim()).slice(0, -1);
}

export const PlaceholderQuery = (dbName: string) => {
  const query = new Query({ name: dbName } as Database, -1);
  query.requestState = REST.Requested;
  return query;
};
type QueryResult = MultiResult | RawResult;
export default class Query extends Sql {
  readonly database: Database;
  readonly id: number;
  @observable requestState: REST = REST.None;
  @observable query: string = '';
  queries = observable<string>([]);
  @observable.ref
  results = observable<QueryResult>([]);
  @observable isClosed: boolean = false;
  @observable proceedAfterError: boolean = true;
  @observable executionMode: ResultType = ResultType.Multi;
  @observable modifiedRawQueryConfig: boolean = false;

  cancelToken: CancelTokenSource = axios.CancelToken.source();

  constructor(database: Database, id: number) {
    super();
    this.database = database;
    this.id = id;
  }

  @computed
  get name() {
    if (this.id <= 1) {
      return this.database.name;
    }
    return `${this.database.name}#${this.id}`;
  }

  @computed
  get databaseType(): 'sql' | 'mysql' | 'pgsql' {
    if (this.database.dbServer.dbType === DbType.MySql) {
      return 'mysql';
    }
    if (this.database.dbServer.dbType === DbType.Psql) {
      return 'pgsql';
    }
    return 'sql';
  }

  @computed
  get derivedExecutionMode(): ResultType {
    // when more than 50 lines sql is written, the parsing
    // of the query can take a lot of time. In this case we
    // suggest to perform a raw sql query.
    if (this.lineCount > RAW_QUERY_THRESHOLD) {
      return ResultType.Raw;
    }
    return ResultType.Multi;
  }

  onSqlChange(sql: string, lineCount: number) {
    const modified = this.derivedExecutionMode !== this.executionMode;

    this.query = sql;
    this.lineCount = lineCount;

    if (!modified) {
      this.executionMode = this.derivedExecutionMode;
    }
  }

  createCopyFor(database: Database) {
    const copy = new Query(database, this.id);
    copy.query = this.query;
    copy.proceedAfterError = this.proceedAfterError;
    copy.executionMode = this.executionMode;
    copy.modifiedRawQueryConfig = this.modifiedRawQueryConfig;
    return copy;
  }

  @action
  setActive() {
    this.database.setActiveQuery(this.id);
  }

  @action
  close() {
    this.database.removeQuery(this);
    this.isClosed = true;
  }

  @computed
  get link() {
    return this.database.link;
  }

  @computed
  get isActive() {
    return this.database.isActive && !this.isClosed && this.id === this.database.activeQueryId;
  }

  @action
  toggleProceedAfterError() {
    this.proceedAfterError = !this.proceedAfterError;
  }

  @action
  toggleExecuteRawQuery() {
    this.executionMode = this.executionMode === ResultType.Multi ? ResultType.Raw : ResultType.Multi;
  }

  @computed
  get queryExecutionTime(): number {
    if (this.results[0]?.type === ResultType.Multi) {
      return _.sumBy(this.results, 'time');
    }
    return this.results[0]?.time ?? 0;
  }

  run() {
    let runner: () => Promise<QueryResult[] | void>;
    if (this.executionMode === ResultType.Raw) {
      runner = () => this.runRawQuery();
    } else {
      runner = () => this.runMultiQuery();
    }
    runner().then((result: QueryResult[] | void) => {
      if (!result) {
        return;
      }
      const count = this.results.reduce((cnt, res) => cnt + (res.state !== ResultState.Skipped ? 1 : 0), 0);
      const errorCount = this.results.reduce(
        (cnt, res) => cnt + (res.state === ResultState.Error ? 1 : 0),
        0
      );
      this.database.incrementQueryCount(count, errorCount);
    });
  }

  @computed
  get resultTableData(): TableData[] {
    return this.results.map((res) => res.tableData);
  }

  @action
  cancel() {
    this.cancelToken.cancel();
    this.cancelToken = axios.CancelToken.source();
    this.requestState = REST.Canceled;
  }

  private runMultiQuery(): Promise<QueryResult[] | void> {
    this.requestState = REST.Requested;
    const rawInput = this.query;
    const t0 = Date.now();
    const queries = identifyCommands(rawInput);
    console.log('Time to parse: ', (Date.now() - t0) / 1000.0);
    return fetchQuery(
      this.database.dbServerId,
      this.database.name,
      queries,
      this.proceedAfterError,
      this.cancelToken
    )
      .then(({ data }) => {
        const results = data.map((res, idx) => new MultiResult(res, idx));
        console.log('Got result: ', (Date.now() - t0) / 1000.0);
        this.queries.replace(queries);
        this.results.replace(results);
        this.requestState = REST.Success;
        return this.results;
      })
      .catch(() => {
        this.requestState = REST.Error;
      });
  }

  private runRawQuery(): Promise<QueryResult[] | void> {
    this.queries.clear();
    this.requestState = REST.Requested;
    return rawQuery(this.database.dbServerId, this.database.name, this.query, this.cancelToken)
      .then(({ data }) => {
        if (data.state === ResultState.Error) {
          this.results.replace([new RawResult(data, 0)]);
        } else {
          const results = data.result.map(
            (res, idx) => new RawResult({ state: ResultState.Success, time: data.time, result: res }, idx)
          );
          this.results.replace(results);
        }
        this.requestState = REST.Success;
        return this.results;
      })
      .catch(() => {
        this.requestState = REST.Error;
      });
  }
}
