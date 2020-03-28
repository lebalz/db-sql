import api from './base';
import { AxiosPromise } from 'axios';
import { DbType, UpdateProps } from '../models/DbConnection';

export interface DbConnection {
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
}
export interface DbTable {
  name: string;
}

export interface SqlTypeMetadata {
  limit: number;
  precision?: number;
  scale?: number;
  sql_type: string;
  type: string;
}

export interface ColumnProps {
  name: string;
  collation: string;
  default: string;
  default_function: string;
  null: boolean;
  serial: boolean;
  is_primary: boolean;
  sql_type_metadata: SqlTypeMetadata;
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

export interface ForeignKeyProps {
  from_table: string;
  to_table: string;
  options: ForeignKeyOption;
}

export interface IndexProps {
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

export function newDbConnection(dbConnection: CreateProps) {
  return api.post('/db_connections', dbConnection);
}

export function dbConnections(): AxiosPromise<DbConnection[]> {
  return api.get('/db_connections');
}

export function remove(id: string) {
  return api.delete(`/db_connections/${id}`);
}

export function dbConnectionPassword(id: string): AxiosPromise<{ password: string }> {
  return api.get(`/db_connections/${id}/password`);
}

export function updateConnection(connection: UpdateProps) {
  return api.put(`/db_connections/${connection.id}`, {
    data: connection
  });
}
export function createConnection(connection: CreateProps): AxiosPromise<DbConnection> {
  return api.post('/db_connections', connection);
}

export function databases(id: string): AxiosPromise<Database[]> {
  return api.get(`/db_connections/${id}/databases`);
}

export function tables(id: string, databaseName: string): AxiosPromise<DbTable[]> {
  return api.get(`/db_connections/${id}/${databaseName}/tables`);
}

export function columns(
  id: string,
  databaseName: string,
  tableName: string
): AxiosPromise<ColumnProps[]> {
  return api.get(`/db_connections/${id}/${databaseName}/${tableName}/columns`);
}

export function foreignKeys(
  id: string,
  databaseName: string,
  tableName: string
): AxiosPromise<ForeignKeyProps[]> {
  return api.get(`/db_connections/${id}/${databaseName}/${tableName}/foreign_keys`);
}

export function indexes(
  id: string,
  databaseName: string,
  tableName: string
): AxiosPromise<IndexProps[]> {
  return api.get(`/db_connections/${id}/${databaseName}/${tableName}/indexes`);
}

export function query(
  id: string,
  databaseName: string,
  queries: string[]
): AxiosPromise<QueryResult[]> {
  return api.post(`/db_connections/${id}/${databaseName}/multi_query`, {
    queries: queries
  });
}
