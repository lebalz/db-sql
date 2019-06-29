import api from './base';
import { AxiosPromise } from 'axios';
import { DbType, UpdateProps } from '../models/DbConnection';
import { Database, DbTable } from './db_connection';

export interface DbConnection {
  db_type: DbType;
  host: string;
  port: number;
  username: string;
  initial_db?: string;
  initial_schema?: string;
  password: string;
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

export function test(dbConnection: DbConnection): AxiosPromise<{ success: boolean }> {
  return api.post(
    '/temp_db_connection/test',
    dbConnection
  );
}