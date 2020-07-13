import api from './base';
import { AxiosPromise, CancelTokenSource } from 'axios';
import { DbServer } from './db_server';

export interface ChangeableProps {
  description?: string;
  is_private: boolean;
}

export interface SqlQuery extends ChangeableProps {
  id: string;
  user_id: string;
  db_server_id: string;
  db_name: string;
  query: string;
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