import api from './base';
import { AxiosPromise, CancelTokenSource } from 'axios';
import { DbType, UpdateProps } from '../models/DbServer';

export interface DbServer {
  id: string;
  name: string;
  db_type: DbType;
  host: string;
  port: number;
  username: string;
  initial_db?: string;
  initial_table?: string;
  query_count: number;
  error_query_count: number;
  created_at: string;
  updated_at: string;
}
export interface SqlTypeMetadata {
  limit: number;
  precision?: number;
  scale?: number;
  sql_type: string;
  type: string;
}

export interface Column {
  name: string;
  collation: string;
  default: string;
  default_function: string;
  null: boolean;
  serial: boolean;
  is_primary: boolean;
  sql_type_metadata: SqlTypeMetadata;
}

export interface ForeignKeyOption {
  column: string;
  name: string;
  primary_key: string;
  on_update?: string;
  on_delete?: string;
}

export interface ForeignKey {
  from_table: string;
  to_table: string;
  options: ForeignKeyOption;
}

export interface Index {
  table_name: string;
  name: string;
  unique: boolean;
  columns: string[];
  lengths: any;
  orders: any;
  opclasses: any;
  where: any;
  type: any;
  using: string;
  comment?: string;
}

export interface DbTable {
  name: string;
  columns: Column[];
  indices: Index[];
  foreign_keys: ForeignKey[];
}

export interface Database {
  name: string;
  db_server_id: string;
  tables: DbTable[];
}

export interface DatabaseName {
  name: string;
  db_server_id: string;
}

export interface CreateProps {
  name: string;
  db_type: DbType;
  host: string;
  port: number;
  username: string;
  initial_db?: string;
  initial_table?: string;
}

export type ResultRow = { [key: string]: string | number };

export type ResultTable = ResultRow[];

export enum ResultType {
  Success = 'success',
  Error = 'error',
  Skipped = 'skipped'
}
interface Result {
  time: number;
  type: ResultType;
}
export interface SuccessQuery extends Result {
  result: ResultTable;
  type: ResultType.Success;
}
export interface ErrorQuery extends Result {
  error: string;
  type: ResultType.Error;
}

export interface SkippedQuery extends Result {
  type: ResultType.Skipped;
}
interface SuccessRawQuery extends Result {
  result: ResultTable[];
  type: ResultType.Success;
}

export type MultiQueryResult = SuccessQuery | ErrorQuery | SkippedQuery;

export type RawQueryResult = SuccessRawQuery | ErrorQuery;

export function newDbServer(dbServer: CreateProps, cancelToken: CancelTokenSource) {
  return api.post('/db_servers', dbServer, { cancelToken: cancelToken.token });
}

export function dbServers(cancelToken: CancelTokenSource): AxiosPromise<DbServer[]> {
  return api.get('/db_servers', { cancelToken: cancelToken.token });
}

export function remove(id: string, cancelToken: CancelTokenSource) {
  return api.delete(`/db_servers/${id}`, { cancelToken: cancelToken.token });
}

export function dbServerPassword(
  id: string,
  cancelToken: CancelTokenSource
): AxiosPromise<{ password: string }> {
  return api.get(`/db_servers/${id}/password`, { cancelToken: cancelToken.token });
}

export function updateDbServer(connection: UpdateProps, cancelToken: CancelTokenSource) {
  return api.put(
    `/db_servers/${connection.id}`,
    {
      data: connection
    },
    { cancelToken: cancelToken.token }
  );
}
export function createDbServer(
  connection: CreateProps,
  cancelToken: CancelTokenSource
): AxiosPromise<DbServer> {
  return api.post('/db_servers', connection, { cancelToken: cancelToken.token });
}

export function databases(id: string, cancelToken: CancelTokenSource): AxiosPromise<DatabaseName[]> {
  return api.get(`/db_servers/${id}/databases`, { cancelToken: cancelToken.token });
}

export function database(id: string, dbName: string, cancelToken: CancelTokenSource): AxiosPromise<Database> {
  return api.get(`/db_servers/${id}/${dbName}`, { cancelToken: cancelToken.token });
}

export function query(
  id: string,
  databaseName: string,
  queries: string[],
  proceed_after_error: boolean,
  cancelToken: CancelTokenSource
): AxiosPromise<MultiQueryResult[]> {
  return api.post(
    `/db_servers/${id}/${databaseName}/multi_query`,
    {
      queries: queries,
      proceed_after_error: proceed_after_error
    },
    { cancelToken: cancelToken.token }
  );
}

export function rawQuery(
  id: string,
  databaseName: string,
  query: string,
  cancelToken: CancelTokenSource
): AxiosPromise<RawQueryResult> {
  return api.post(
    `/db_servers/${id}/${databaseName}/raw_query`,
    {
      query: query,
    },
    { cancelToken: cancelToken.token }
  );
}
