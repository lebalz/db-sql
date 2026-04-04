import api from './base';
import { AxiosPromise, CancelTokenSource } from 'axios';
import { DbType } from '../models/DbServer';
import { OwnerType } from './db_server';

export interface DbServer {
  name: string;
  db_type: DbType;
  owner_type: OwnerType,
  owner_id: string,
  host: string;
  port: number;
  username: string;
  initial_db?: string;
  initial_table?: string;
  password: string;
  database_schema_query_id?: string;
}

export interface DatabaseName {
  name: string;
}

export interface DbTableName {
  name: string;
}

export interface TestResult {
  success: boolean;
  message?: string;
}

export function databases(dbServer: DbServer, cancelToken: CancelTokenSource): AxiosPromise<DatabaseName[]> {
  return api.post('/temp_db_server/databases', dbServer, {
    cancelToken: cancelToken.token
  });
}

export function tables(
  dbServer: DbServer,
  databaseName: string,
  cancelToken: CancelTokenSource
): AxiosPromise<DbTableName[]> {
  return api.post(`/temp_db_server/${databaseName}/tables`, dbServer, {
    cancelToken: cancelToken.token
  });
}

export function test(dbServer: DbServer, cancelToken: CancelTokenSource): AxiosPromise<TestResult> {
  return api.post('/temp_db_server/test', dbServer, {
    cancelToken: cancelToken.token
  });
}
