import { observable, computed, action } from 'mobx';
import { REST } from '../declarations/REST';
import {
  MultiQueryResult,
  RawQueryResult,
  query as fetchQuery,
  rawQuery,
  ResultType,
  ResultTable as ResultTableData
} from '../api/db_server';
import Database from './Database';
import axios, { CancelTokenSource } from 'axios';
import { QuerySeparationGrammarLexer } from '../antlr/QuerySeparationGrammarLexer';
import { QuerySeparationGrammarParser } from '../antlr/QuerySeparationGrammarParser';
import { ANTLRInputStream, CommonTokenStream } from 'antlr4ts';
import _ from 'lodash';
import User from './User';

function identifyCommands(queryText: string) {
  const inputStream = new ANTLRInputStream(queryText);
  console.time('lexing');
  const lexer = new QuerySeparationGrammarLexer(inputStream);
  console.timeLog('lexing');
  const tokenStream = new CommonTokenStream(lexer);
  console.time('parse');
  const parser = new QuerySeparationGrammarParser(tokenStream);
  console.timeLog('parse');
  console.time('queryText');
  const { children } = parser.queriesText();
  console.timeLog('queryText');
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

export enum QueryExecutionMode {
  Multi = 'multi_query',
  Raw = 'raw_query'
}

interface MultiResult {
  type: QueryExecutionMode.Multi;
  results: MultiQueryResult[];
}

interface RawResult {
  type: QueryExecutionMode.Raw;
  result: RawQueryResult;
}

export type QueryResult = MultiResult | RawResult;

interface SqlTableData {
  type: ResultType;
  time?: number;
}

interface SuccessTableData extends SqlTableData {
  type: ResultType.Success;
  result: ResultTableData;
}
interface ErrorTableData extends SqlTableData {
  type: ResultType.Error;
  error: string;
}
interface SkipTableData extends SqlTableData {
  type: ResultType.Skipped;
}

export type TableData = SuccessTableData | ErrorTableData | SkipTableData;

export default class Query {
  readonly database: Database;
  readonly id: number;
  @observable requestState: REST = REST.None;
  @observable query: string = '';
  queries = observable<string>([]);
  @observable result: QueryResult = { type: QueryExecutionMode.Multi, results: [] };
  @observable active: boolean = false;
  @observable isClosed: boolean = false;
  @observable proceedAfterError: boolean = true;
  @observable executionMode: QueryExecutionMode = QueryExecutionMode.Multi;
  @observable modifiedRawQueryConfig: boolean = false;

  cancelToken: CancelTokenSource = axios.CancelToken.source();

  constructor(database: Database, id: number, loading: boolean = false) {
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
  get derivedExecutionMode(): QueryExecutionMode {
    // when more than 50 lines sql is written, the parsing
    // of the query can take a lot of time. In this case we
    // suggest to perform a raw sql query.
    if (/(.*[\r\n|\r|\n]){50,}/.test(this.query)) {
      return QueryExecutionMode.Raw;
    }
    return QueryExecutionMode.Multi;
  }

  createCopyFor(database: Database) {
    const copy = new Query(database, this.id);
    copy.query = this.query;
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
    this.executionMode =
      this.executionMode === QueryExecutionMode.Multi ? QueryExecutionMode.Raw : QueryExecutionMode.Multi;
  }

  @computed
  get queryExecutionTime(): number {
    if (this.result.type === QueryExecutionMode.Multi) {
      return _.sumBy(this.result.results, 'time');
    }
    return this.result.result.time;
  }

  run() {
    let runner: () => Promise<QueryResult | void>;
    if (this.executionMode === QueryExecutionMode.Raw) {
      runner = () => this.runRawQuery();
    } else {
      runner = () => this.runMultiQuery();
    }
    runner().then((result: QueryResult | void) => {
      if (!result) {
        return;
      }
      const resultData = this.resultTableDataFor(result);
      const count = resultData.reduce((cnt, res) => (cnt + (res.type !== ResultType.Skipped ? 1 : 0)), 0);
      const errorCount = resultData.reduce((cnt, res) => (cnt + (res.type === ResultType.Error ? 1 : 0)), 0);
      this.database.incrementQueryCount(count, errorCount);
    });
  }

  @computed
  get resultTableData(): TableData[] {
    return this.resultTableDataFor(this.result);
  }

  @action
  cancel() {
    this.cancelToken.cancel();
    this.cancelToken = axios.CancelToken.source();
    this.requestState = REST.Canceled;
  }

  private runMultiQuery() {
    this.requestState = REST.Requested;
    const rawInput = this.query;
    const t0 = Date.now();
    const queries = identifyCommands(rawInput);
    console.log('Time to parse: ', (Date.now() - t0) / 1000.0);
    return fetchQuery(this.database.dbServerId, this.name, queries, this.proceedAfterError, this.cancelToken)
      .then(({ data }) => {
        console.log('Got result: ', (Date.now() - t0) / 1000.0);
        this.queries.replace(queries);
        this.result = {
          results: data,
          type: QueryExecutionMode.Multi
        };
        this.requestState = REST.Success;
        return this.result;
      })
      .catch((e) => {
        this.requestState = REST.Error;
      });
  }
 
 private runRawQuery() {
    this.queries.clear();
    this.requestState = REST.Requested;
    return rawQuery(this.database.dbServerId, this.name, this.query, this.cancelToken)
      .then(({ data }) => {
        this.result = {
          result: data,
          type: QueryExecutionMode.Raw
        };
        this.requestState = REST.Success;
        return this.result;
      })
      .catch((e) => {
        this.requestState = REST.Error;
      });
  }

  private resultTableDataFor(result: QueryResult): TableData[] {
    if (result.type === QueryExecutionMode.Multi) {
      return this.multiQueryTableData(result.results);
    }
    return this.rawQueryTableData(result.result);
  }

  private rawQueryTableData(result: RawQueryResult): TableData[] {
    if (result.type === ResultType.Error) {
      return [result];
    }
    return result.result.map((res) => ({
      type: ResultType.Success,
      result: res
    }));
  }

  private multiQueryTableData(results: MultiQueryResult[]): TableData[] {
    return results;
  }
}
