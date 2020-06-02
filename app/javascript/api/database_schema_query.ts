import api from './base';
import { AxiosPromise } from 'axios';
import { DbType } from '../models/DbServer';

export interface NewRevision {
  is_private: boolean;
  query: string;
}

export interface DatabaseSchemaQuery extends NewRevision {
  id: string;
  db_type: DbType;
  is_default: boolean;
  is_latest: boolean;
  created_at: string;
  updated_at: string;
  author_id: string;
  previous_revision_id?: string;
  next_revision_ids: string[];
}

export function defaultDatabaseSchemaQueries(): AxiosPromise<DatabaseSchemaQuery[]> {
  return api.get('/database_schema_queries/default');
}
export function databaseSchemaQuery(id: string): AxiosPromise<DatabaseSchemaQuery> {
  return api.get(`/database_schema_queries/${id}`);
}

export function databaseSchemaQueries(): AxiosPromise<DatabaseSchemaQuery[]> {
  return api.get('/database_schema_queries');
}

export function newRevision(id: string, newRevision: NewRevision): AxiosPromise<DatabaseSchemaQuery> {
  return api.post(`/database_schema_queries/${id}/new_revision`, { data: newRevision });
}

export function makeDefault(id: string): AxiosPromise<DatabaseSchemaQuery> {
  return api.get(`/database_schema_queries/${id}/make_default`);
}

export function revisions(id: string): AxiosPromise<DatabaseSchemaQuery[]> {
  return api.get(`/database_schema_queries/${id}/revisions`);
}

export function latestRevisions(
  offset: number,
  limit: number,
  dbType?: DbType
): AxiosPromise<DatabaseSchemaQuery[]> {
  return api.get(`/database_schema_queries/latest_revisions`, {
    params: {
      offset: offset,
      limit: limit,
      db_type: dbType
    }
  });
}

export function remove(id: string) {
  return api.delete(`/database_schema_queries/${id}`);
}
