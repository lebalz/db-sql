import api from './base';
import { AxiosPromise, CancelTokenSource } from 'axios';
import { DbType, UpdateProps } from '../models/DbConnection';
import { Database, DbTable } from './db_connection';

export interface DbConnection {
  name: string;
  db_type: DbType;
  host: string;
  port: number;
  username: string;
  initial_db?: string;
  initial_table?: string;
  password: string;
}

export interface TestResult {
  success: boolean;
  message?: string;
}

export function databases(
  dbConnection: DbConnection,
  cancelToken: CancelTokenSource
): AxiosPromise<Database[]> {
  return api.post('/temp_db_connection/databases', dbConnection, {
    cancelToken: cancelToken.token
  });
}

export function tables(
  dbConnection: DbConnection,
  databaseName: string,
  cancelToken: CancelTokenSource
): AxiosPromise<DbTable[]> {
  return api.post(`/temp_db_connection/${databaseName}/tables`, dbConnection, {
    cancelToken: cancelToken.token
  });
}

export function test(
  dbConnection: DbConnection,
  cancelToken: CancelTokenSource
): AxiosPromise<TestResult> {
  return api.post('/temp_db_connection/test', dbConnection, {
    cancelToken: cancelToken.token
  });
}
