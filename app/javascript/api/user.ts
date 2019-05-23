import api from './base';
import { AxiosPromise } from 'axios';
import { Role } from '../models/User';

export interface User {
  id: string;
  email: string;
  last_login: string;
  login_count: number;
  role: Role;
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

export function validate(user: User): AxiosPromise<User> {
  return api.post(
    'user/validate',
    user
  );
}

export function signup(email: string, password: string): AxiosPromise<LoginUser> {
  return api.post(
    'user/signup',
    {
      email: email,
      password: password
    }
  );
}

export function newPassword(
  oldPassword: string,
  newPassword: string,
  newPasswordConfirmation: string
): AxiosPromise<LoginUser> {
  return api.post(
    'user/new_password',
    {
      old_password: oldPassword,
      new_password: newPassword,
      password_confirmation: newPasswordConfirmation
    }
  );
}