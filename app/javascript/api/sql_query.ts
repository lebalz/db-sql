import api from './base';
import { AxiosPromise, CancelTokenSource } from 'axios';
import { DbServer } from './db_server';

export enum Changeable {
  IsPrivate = 'is_private',
  IsFavorite = 'is_favorite'
}

export interface ChangeableProps {
  [Changeable.IsPrivate]: boolean;
  [Changeable.IsFavorite]: boolean;
}

export interface SqlError {
  query_idx: number;
  error: string;
}
export interface SqlQuery extends ChangeableProps {
  id: string;
  user_id: string;
  db_server_id: string;
  db_name: string;
  query: string;
  is_valid: boolean;
  exec_time?: number;
  error: SqlError[];
  created_at: string;
  updated_at: string;
}

export function getSqlQueries(cancelToken: CancelTokenSource): AxiosPromise<SqlQuery[]> {
  return api.get('sql_queries', { cancelToken: cancelToken.token });
}

export function getSqlQuery(id: string): AxiosPromise<SqlQuery> {
  return api.get(`sql_queries/${id}`);
}

export function getShared(groupId: string): AxiosPromise<SqlQuery[]> {
  return api.get(`sql_queries/shared?group_id=${groupId}`);
}

export function update(id: string, data: ChangeableProps): AxiosPromise<SqlQuery> {
  return api.put(`sql_queries/${id}`, {
    data: data
  });
}
