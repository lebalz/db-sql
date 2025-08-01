import api from './base';
import { AxiosPromise, CancelTokenSource } from 'axios';
import { DbType, UpdateProps } from '../models/DbServer';

export enum OwnerType {
  User = 'user',
  Group = 'group'
}

export interface DbServer {
  id: string;
  name: string;
  db_type: DbType;
  owner_type: OwnerType;
  owner_id: string;
  host: string;
  port: number;
  username: string;
  initial_db?: string;
  default_sql_limit: number;
  initial_table?: string;
  query_count: number;
  error_query_count: number;
  database_schema_query_id: string;
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

export interface Constraint {
  name: string;
  schema?: string;
}

export interface ReferenceConstraint extends Constraint {
  schema: string;
  table: string;
  column: string;
}

export interface Column {
  name: string;
  position: number;
  default: string;
  null: boolean;
  is_primary: boolean;
  is_foreign: boolean;
  sql_type_metadata: SqlTypeMetadata;
  constraints: (Constraint | ReferenceConstraint)[];
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
}

export interface Schema {
  name: string;
  tables: DbTable[];
}

export interface Database {
  name: string;
  db_server_id: string;
  schemas: Schema[];
}

export interface DatabaseName {
  name: string;
  db_server_id: string;
}

export interface CreateProps {
  name: string;
  owner_type: OwnerType;
  owner_id: string;
  db_type: DbType;
  host: string;
  port: number;
  username: string;
  initial_db?: string;
  initial_table?: string;
}

export type ResultRow = { [key: string]: string | number };

export type ResultTable = ResultRow[];

export enum ResultState {
  Success = 'success',
  Error = 'error',
  Skipped = 'skipped'
}

export interface Result {
  time: number;
  state: ResultState;
  limit_reached?: boolean;
}

interface Response extends Result {
  query_id: string;
}

export interface SuccessQuery extends Result {
  result: ResultTable;
  state: ResultState.Success;
}
export interface ErrorQuery extends Result {
  error: string;
  state: ResultState.Error;
}

export interface ErrorQueryResponse extends ErrorQuery {
  query_id: string;
}

export interface SkippedQuery extends Result {
  state: ResultState.Skipped;
}
interface SuccessRawQuery extends Response {
  result: ResultTable[];
  state: ResultState.Success;
  limit_reached?: boolean;
}

interface MultiQueryResponse extends Response {
  result: MultiQueryResult[];
}

export type MultiQueryResult = SuccessQuery | ErrorQuery | SkippedQuery;
export type RawQueryResult = SuccessRawQuery | ErrorQueryResponse;

export function newDbServer(dbServer: CreateProps, cancelToken: CancelTokenSource) {
  return api.post('/db_servers', dbServer, { cancelToken: cancelToken.token });
}

export function dbServer(id: string, cancelToken: CancelTokenSource): AxiosPromise<DbServer> {
  return api.get(`/db_servers/${id}`, { cancelToken: cancelToken.token });
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
): AxiosPromise<MultiQueryResponse> {
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
      query: query
    },
    { cancelToken: cancelToken.token }
  );
}
