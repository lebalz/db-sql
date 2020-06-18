import api from './base';
import { AxiosPromise, CancelTokenSource } from 'axios';
import { DbServer } from './db_server';
import { User } from './user';

export interface Group {
  id: string;
  is_private: boolean;
  name: string;
  created_at: string;
  users: User[];
  db_servers: DbServer[];
  admin_ids: string[];
  outdated_user_ids: string[];
}

export function getGroups(cancelToken: CancelTokenSource): AxiosPromise<Group[]> {
  return api.get('groups', { cancelToken: cancelToken.token });
}

export function getPublicGroups(
  offset: number,
  limit: number,
  cancelToken: CancelTokenSource
): AxiosPromise<Group> {
  return api.get('public_groups', {
    cancelToken: cancelToken.token,
    params: { offset: offset, limit: limit }
  });
}
