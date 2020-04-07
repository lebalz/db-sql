import { observable, computed, action } from 'mobx';
import { REST } from '../declarations/REST';
import { QueryResult, query as fetchQuery } from '../api/db_server';
import Database from './Database';
import axios, { CancelTokenSource } from 'axios';
import { QuerySeparationGrammarLexer } from '../antlr/QuerySeparationGrammarLexer';
import { QuerySeparationGrammarParser } from '../antlr/QuerySeparationGrammarParser';
import { ANTLRInputStream, CommonTokenStream } from 'antlr4ts';

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

  return children.map((child) => child.text).slice(0, -1);
}

export const PlaceholderQuery = (dbName: string) => {
  const query = new Query({ name: dbName } as Database, -1);
  query.requestState = REST.Requested;
  return query;
};

export default class Query {
  readonly database: Database;
  readonly id: number;
  @observable requestState: REST = REST.None;
  @observable query: string = '';
  @observable results: QueryResult[] = [];
  @observable active: boolean = false;
  @observable isClosed: boolean = false;
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
    return (
      this.database.isActive && !this.isClosed && this.id === this.database.activeQueryId
    );
  }

  run() {
    this.requestState = REST.Requested;
    const rawInput = this.query;
    const t0 = Date.now();
    const queries = identifyCommands(rawInput);
    console.log('Time to parse: ', (Date.now() - t0) / 1000.0);
    fetchQuery(this.database.dbServerId, this.name, queries, this.cancelToken)
      .then(({ data }) => {
        console.log('Got result: ', (Date.now() - t0) / 1000.0);
        this.results = data;
        console.log(data);
        this.requestState = REST.Success;
      })
      .catch((e) => {
        this.requestState = REST.Error;
      });
  }

  @action
  cancel() {
    this.cancelToken.cancel();
    this.cancelToken = axios.CancelToken.source();
    this.requestState = REST.Canceled;
  }
}
