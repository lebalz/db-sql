import api from './base';
import { AxiosPromise, CancelTokenSource } from 'axios';
import { DbType, UpdateProps } from '../models/DbServer';
import { Database, DbTable } from './db_server';

export interface DbServer {
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
  dbServer: DbServer,
  cancelToken: CancelTokenSource
): AxiosPromise<Database[]> {
  return api.post('/temp_db_server/databases', dbServer, {
    cancelToken: cancelToken.token
  });
}

export function tables(
  dbServer: DbServer,
  databaseName: string,
  cancelToken: CancelTokenSource
): AxiosPromise<DbTable[]> {
  return api.post(`/temp_db_server/${databaseName}/tables`, dbServer, {
    cancelToken: cancelToken.token
  });
}

export function test(
  dbServer: DbServer,
  cancelToken: CancelTokenSource
): AxiosPromise<TestResult> {
  return api.post('/temp_db_server/test', dbServer, {
    cancelToken: cancelToken.token
  });
}
