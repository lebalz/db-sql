import { observable, action, reaction, computed } from 'mobx';
import { RootStore, Store } from './root_store';
import _ from 'lodash';
import { getSqlQueries, update, SqlQuery as SqlQueryProps, getShared, SqlError } from '../api/sql_query';
import SqlQuery from '../models/SqlQuery';
import { computedFn } from 'mobx-utils';
import { ANTLRInputStream, CommonTokenStream } from 'antlr4ts';
import { QuerySeparationGrammarLexer } from '../antlr/QuerySeparationGrammarLexer';
import { QuerySeparationGrammarParser } from '../antlr/QuerySeparationGrammarParser';
import { ErrorQuery, query as fetchQuery, rawQuery, ResultState } from '../api/db_server';
import { REST } from '../declarations/REST';
import { QueryResult } from '../models/QueryEditor';
import MultiResult from '../models/Results/MultiResult';
import RawResult from '../models/Results/RawResult';
import axios, { CancelTokenSource } from 'axios';

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

class State {
  sqlQueries = observable<SqlQuery>([]);
  @observable selectedQueryId?: string;
  tempIdCounter = -1;
}

class SqlQueryStore implements Store {
  private readonly root: RootStore;
  @observable.ref
  private state = new State();
  cancelToken: CancelTokenSource = axios.CancelToken.source();

  constructor(root: RootStore) {
    this.root = root;
    reaction(
      () => this.root.groupStore.initialized,
      (isInitialized) => {
        if (isInitialized) {
          this.loadSqlQueries();
        }
      }
    );
  }

  @computed
  get sqlQueries(): SqlQuery[] {
    return _.orderBy(this.state.sqlQueries, ['isFavorite', 'createdAt'], ['desc', 'desc']);
  }

  find = computedFn(
    function (this: SqlQueryStore, id?: string): SqlQuery | undefined {
      if (!id) {
        return;
      }
      return this.state.sqlQueries.find((q) => q.id === id);
    },
    { keepAlive: true }
  );

  findBy = computedFn(function (this: SqlQueryStore, dbServerId: string, dbName: string): SqlQuery[] {
    if (!dbServerId || !dbName) {
      return [];
    }
    return _.orderBy(
      this.state.sqlQueries.filter((q) => q.dbServerId === dbServerId && q.dbName === dbName),
      ['isFavorite', 'createdAt'],
      ['desc', 'desc']
    );
  });

  @action
  setSelectedSqlQueryId(id: string | undefined) {
    this.state.selectedQueryId = id;
  }

  @action
  refresh() {
    this.state = new State();
    this.loadSqlQueries();
  }

  @computed
  get selectedSqlQuery(): SqlQuery | undefined {
    if (!this.state.selectedQueryId) {
      return this.sqlQueries[0];
    }
    return this.find(this.state.selectedQueryId);
  }

  @action
  loadSqlQueries(): Promise<boolean> {
    this.state.sqlQueries.clear();
    return getSqlQueries(this.root.cancelToken)
      .then(({ data }) => {
        const queries = data.map(
          (sqlQuery) => new SqlQuery(this, this.root.dbServer, this.root.user, sqlQuery)
        );
        this.state.sqlQueries.push(...queries);
      })
      .then(() => {
        return Promise.all([
          ...this.root.groupStore.joinedGroups.map((group) => {
            getShared(group.id).then(({ data }) => {
              const queries = data
                .filter((query) => !this.find(query.id))
                .map((sqlQuery) => new SqlQuery(this, this.root.dbServer, this.root.user, sqlQuery));
              this.state.sqlQueries.push(...queries);
            });
          })
        ]);
      })
      .then(() => true);
  }

  @action
  updateSqlQuery(sqlQuery: SqlQuery) {
    if (!sqlQuery.isDirty) {
      return;
    }
    update(sqlQuery.id, sqlQuery.changeableProps).then(({ data }) => {
      this.addSqlQuery(data);
    });
  }

  @action
  addSqlQuery(sqlQuery: SqlQueryProps) {
    const oldQuery = this.find(sqlQuery.id);
    if (oldQuery) {
      this.state.sqlQueries.remove(oldQuery);
    }
    this.state.sqlQueries.push(new SqlQuery(this, this.root.dbServer, this.root.user, sqlQuery));
  }

  @action
  cleanup() {
    this.cancelToken.cancel();
    this.state = new State();
  }

  runMultiQuery(
    rawInput: string,
    server: { id: string; name: string },
    proceedAfterError: boolean
  ): Promise<{ queries: string[]; result: MultiResult[] }> {
    const queries = identifyCommands(rawInput);
    const t0 = Date.now();
    return fetchQuery(server.id, server.name, queries, proceedAfterError, this.cancelToken).then(
      ({ data }) => {
        const errors: SqlError[] = [];
        data.result.forEach((res, idx) => {
          if (res.state === ResultState.Error) {
            errors.push({ query_idx: idx, error: res.error });
          }
        });
        this.addTempQuery(
          rawInput,
          data.query_id,
          data.state === 'success',
          (Date.now() - t0) / 1000,
          server,
          errors
        );
        return { queries: queries, result: data.result.map((res, idx) => new MultiResult(res, idx)) };
      }
    );
  }

  @action
  runRawQuery(rawInput: string, server: { id: string; name: string }): Promise<RawResult[]> {
    const t0 = Date.now();
    return rawQuery(server.id, server.name, rawInput, this.cancelToken).then(({ data }) => {
      if (data.state === ResultState.Error) {
        this.addTempQuery(rawInput, data.query_id, false, (Date.now() - t0) / 1000, server, [
          { query_idx: 0, error: data.error }
        ]);
        return [new RawResult(data, 0)];
      }
      this.addTempQuery(rawInput, data.query_id, true, (Date.now() - t0) / 1000, server, []);
      return data.result.map(
        (res, idx) => new RawResult({ state: ResultState.Success, time: data.time, result: res }, idx)
      );
    });
  }

  @action
  addTempQuery(
    query: string,
    id: string,
    valid: boolean,
    time_s: number,
    server: { id: string; name: string },
    errors: SqlError[]
  ) {
    this.state.sqlQueries.push(
      new SqlQuery(this, this.root.dbServer, this.root.user, {
        created_at: new Date(Date.now()).toISOString(),
        updated_at: new Date(Date.now()).toISOString(),
        db_name: server.name,
        db_server_id: server.id,
        id: id,
        is_favorite: false,
        is_private: true,
        query: query,
        is_valid: valid,
        user_id: this.root.session.currentUser.id,
        exec_time: time_s,
        error: errors
      })
    );
  }
}

export default SqlQueryStore;
