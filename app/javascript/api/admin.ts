import api from './base';
import { AxiosPromise, CancelTokenSource } from 'axios';
import { User } from './user';

export function users(cancelToken: CancelTokenSource): AxiosPromise<User[]> {
  return api.get('admin/users', { cancelToken: cancelToken.token });
}

export function deleteUser(id: string, cancelToken: CancelTokenSource) {
  return api.delete(`admin/users/${id}`, { cancelToken: cancelToken.token });
}

export function user(id: string, cancelToken: CancelTokenSource): AxiosPromise<User> {
  return api.get(`admin/users/${id}`, { cancelToken: cancelToken.token });
}

export function updateUser(
  id: string,
  userParams: Partial<User>,
  cancelToken: CancelTokenSource
) {
  return api.put(
    `admin/users/${id}`,
    {
      data: userParams
    },
    { cancelToken: cancelToken.token }
  );
}
