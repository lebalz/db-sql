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

export interface Database {
  name: string;
}
export interface DbTable {
  name: string;
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

export function databases(id: string): AxiosPromise<Database[]> {
  return api.get(`/db_connections/${id}/databases`);
}

export function tables(id: string, databaseName: string): AxiosPromise<DbTable[]> {
  return api.get(
    `/db_connections/${id}/${databaseName}/tables`
  );
}