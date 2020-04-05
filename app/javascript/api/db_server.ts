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
  created_at: string;
  updated_at: string;
}

export interface Database {
  name: string;
  db_server_id: string;
}
export interface DbTable {
  name: string;
  database_name: string;
  db_server_id: string;
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
  table_name: string;
  database_name: string;
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
  database_name: string;
  db_server_id: string;
}

export interface Index {
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
  table_name: string;
  database_name: string;
  db_server_id: string;
}

export type ResultRow = { [key: string]: string | number };

export type ResultTable = ResultRow[];

export enum ResultType {
  Success = 'success',
  Error = 'error'
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

export type QueryResult = SuccessQuery | ErrorQuery;

export function newDbServer(
  dbServer: CreateProps,
  cancelToken: CancelTokenSource
) {
  return api.post('/db_servers', dbServer, { cancelToken: cancelToken.token });
}

export function dbServers(
  cancelToken: CancelTokenSource
): AxiosPromise<DbServer[]> {
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

export function updateDbServer(
  connection: UpdateProps,
  cancelToken: CancelTokenSource
) {
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

export function databases(
  id: string,
  cancelToken: CancelTokenSource
): AxiosPromise<Database[]> {
  return api.get(`/db_servers/${id}/databases`, { cancelToken: cancelToken.token });
}

export function tables(
  id: string,
  databaseName: string,
  cancelToken: CancelTokenSource
): AxiosPromise<DbTable[]> {
  return api.get(`/db_servers/${id}/${databaseName}/tables`, {
    cancelToken: cancelToken.token
  });
}

export function columns(
  id: string,
  databaseName: string,
  tableName: string,
  cancelToken: CancelTokenSource
): AxiosPromise<Column[]> {
  return api.get(`/db_servers/${id}/${databaseName}/${tableName}/columns`, {
    cancelToken: cancelToken.token
  });
}

export function foreignKeys(
  id: string,
  databaseName: string,
  tableName: string,
  cancelToken: CancelTokenSource
): AxiosPromise<ForeignKey[]> {
  return api.get(`/db_servers/${id}/${databaseName}/${tableName}/foreign_keys`, {
    cancelToken: cancelToken.token
  });
}

export function indexes(
  id: string,
  databaseName: string,
  tableName: string,
  cancelToken: CancelTokenSource
): AxiosPromise<Index[]> {
  return api.get(`/db_servers/${id}/${databaseName}/${tableName}/indexes`, {
    cancelToken: cancelToken.token
  });
}

export function query(
  id: string,
  databaseName: string,
  queries: string[],
  cancelToken: CancelTokenSource
): AxiosPromise<QueryResult[]> {
  return api.post(
    `/db_servers/${id}/${databaseName}/multi_query`,
    {
      queries: queries
    },
    { cancelToken: cancelToken.token }
  );
}
