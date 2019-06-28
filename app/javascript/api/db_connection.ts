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
  initial_schema?: string;
  created_at: string;
  updated_at: string;
}

interface CreateProps extends DbConnection {
  password: string;
}

export function newDbConnection(dbConnection: CreateProps) {
  return api.post(
    '/db_connections',
    dbConnection
  );
}

export function dbConnections(): AxiosPromise<DbConnection[]> {
  return api.get('/db_connections');
}

export function dbConnectionPassword(id: string): AxiosPromise<{ password: string }> {
  return api.get(`/db_connections/${id}/password`);
}

export function updateConnection(connection: UpdateProps) {
  return api.put(
    `/db_connections/${connection.id}`,
    {
      data: connection
    }
  );
}

export function databaseNames(id: string): AxiosPromise<string[]> {
  return api.get(`/db_connections/${id}/database_names`);
}