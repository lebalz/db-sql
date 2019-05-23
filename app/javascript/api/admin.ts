import api from './base';
import { AxiosPromise } from 'axios';
import { User } from './user';

export function users(): AxiosPromise<User[]> {
  return api.get(
    'admin/users',
  );
}

export function deleteUser(id: string) {
  return api.delete(
    `admin/users/${id}`
  );
}
