import api from './base';
import { AxiosPromise } from 'axios';
import { DbType, UpdateProps } from '../models/DbConnection';
import { Database, DbTable } from './db_connection';

export interface DbConnection {
  name: string;
  db_type: DbType;
  host: string;
  port: number;
  username: string;
  initial_db?: string;
  initial_schema?: string;
  password: string;
}

export interface TestResult {
  success: boolean;
  message?: string;
}

export function databases(dbConnection: DbConnection): AxiosPromise<Database[]> {
  return api.post(
    '/temp_db_connection/databases',
    dbConnection
  );
}

export function tables(dbConnection: DbConnection, databaseName: string): AxiosPromise<DbTable[]> {
  return api.post(
    `/temp_db_connection/${databaseName}/tables`,
    dbConnection
  );
}

export function test(dbConnection: DbConnection): AxiosPromise<TestResult> {
  return api.post(
    '/temp_db_connection/test',
    dbConnection
  );
}