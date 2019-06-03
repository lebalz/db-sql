import api from './base';
import { AxiosPromise } from 'axios';
import { DbType } from '../models/DbConnection';

export interface DbConnection {
  id: string;
  name: string;
  db_type: DbType;
  host: string;
  port: number;
  username: string;
  initial_db?: string;
  initial_schema?: string;
  created_at: string;
  updated_at: string;
}

export interface NewDbConnection extends DbConnection {
  password: string;
}

export function newDbConnection(dbConnection: NewDbConnection) {
  return api.post(
    '/db_connections',
    dbConnection
  );
}

export function dbConnections(): AxiosPromise<DbConnection[]> {
  return api.get('/db_connections');
}