import api from './base';
import { AxiosPromise } from 'axios';

export interface User {
  id: string;
  email: string;
  last_login: string;
  created_at: string;
  updated_at: string;
}

export interface LoginUser extends User {
  token: string;
  crypto_key: string;
}

export function login(email: string, password: string): AxiosPromise<LoginUser> {
  return api.post(
    'login',
    {
      email: email,
      password: password
    }
  );
}

export function logout() {
  return api.post(
    'logout'
  );
}

export function validate(user: User): AxiosPromise<{ valid: boolean }> {
  return api.post(
    'user/validate',
    user
  );
}