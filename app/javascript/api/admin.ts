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

export function user(id: string): AxiosPromise<User> {
  return api.get(
    `admin/users/${id}`
  );
}

export function updateUser(id: string, userParams: Partial<User>) {
  return api.put(
    `admin/users/${id}`,
    {
      data: userParams
    }
  );
}
