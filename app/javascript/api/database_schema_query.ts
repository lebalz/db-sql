import api from './base';
import { AxiosPromise } from 'axios';
import { DbType } from '../models/DbServer';
import SchemaQuery from '../models/SchemaQuery';

export enum Changeable {
  Query = 'query',
  Name = 'name',
  Description = 'description',
  IsPrivate = 'is_private',
}
export interface ChangeableProps {
  [Changeable.Query]: string;
  [Changeable.Name]: string;
  [Changeable.Description]?: string;
  [Changeable.IsPrivate]: boolean;
}

export interface DatabaseSchemaQueryStats {
  public_user_count: number;
  reference_count: number;
}

export interface CreateProps extends ChangeableProps {
  db_type: DbType;
}

export interface UpdateProps extends ChangeableProps {
  id: string;
}

export interface DatabaseSchemaQuery extends UpdateProps, CreateProps {
  is_default: boolean;
  created_at: string;
  updated_at: string;
  author_id: string;
  stats: DatabaseSchemaQueryStats;
}

interface FetchParams {
  limit: number;
  offset: number;
  db_type?: DbType;
}
interface DatabaseSchemaQueryCounts {
  [DbType.MySql]: number;
  [DbType.Psql]: number;
}

export function defaultDatabaseSchemaQueries(): AxiosPromise<DatabaseSchemaQuery[]> {
  return api.get('/database_schema_queries/default');
}

export function databaseSchemaQueryCounts(): AxiosPromise<DatabaseSchemaQueryCounts> {
  return api.get('/database_schema_queries/counts');
}

export function databaseSchemaQuery(id: string): AxiosPromise<DatabaseSchemaQuery> {
  return api.get(`/database_schema_queries/${id}`);
}

export function databaseSchemaQueries(params: FetchParams): AxiosPromise<DatabaseSchemaQuery[]> {
  return api.get('/database_schema_queries', { params: params });
}

export function create(schemaQuery: CreateProps): AxiosPromise<DatabaseSchemaQuery> {
  return api.post('/database_schema_queries', schemaQuery);
}

export function update(schemaQuery: UpdateProps): AxiosPromise<DatabaseSchemaQuery> {
  return api.put(`/database_schema_queries/${schemaQuery.id}`, { data: schemaQuery });
}

export function makeDefault(id: string): AxiosPromise<DatabaseSchemaQuery> {
  return api.get(`/database_schema_queries/${id}/make_default`);
}

export function remove(id: string) {
  return api.delete(`/database_schema_queries/${id}`);
}
