import api from './base';
import { AxiosPromise } from 'axios';
import { Role } from '../models/User';

export interface User {
  id: string;
  email: string;
  login_count: number;
  role: Role;
  activated: boolean;
  query_count: number;
  error_query_count: number;
  created_at: string;
  updated_at: string;
  password_reset_requested: boolean;
}

export interface LoginUser extends User {
  token: string;
  crypto_key: string;
}

export function login(email: string, password: string): AxiosPromise<LoginUser> {
  return api.post('login', {
    email: email,
    password: password
  });
}

export function logout() {
  return api.post('logout');
}

export function user(): AxiosPromise<User> {
  return api.get('users/current');
}

export function newPassword(
  oldPassword: string,
  newPassword: string,
  newPasswordConfirmation: string
): AxiosPromise<LoginUser> {
  return api.put('users/current/password', {
    old_password: oldPassword,
    new_password: newPassword,
    password_confirmation: newPasswordConfirmation
  });
}

export function resendActivationLink(email: string) {
  return api.post('users/resend_activation_link', { email: email });
}

export function deleteAccount(password: string) {
  return api.delete('users/current', {
    data: {
      password: password
    }
  });
}

export function signup(email: string, password: string): AxiosPromise<LoginUser> {
  return api.post('users', {
    email: email,
    password: password
  });
}

export function requestPasswordReset(email: string) {
  return api.post('users/reset_password', {
    email: email
  });
}

export function activateAccount(id: string, activationToken: string) {
  return api.put(`users/${id}/activate`, {
    activation_token: activationToken
  });
}

export function resetPassword(
  id: string,
  resetToken: string,
  password: string,
  passwordConfirmation: string
) {
  return api.post(`users/${id}/reset_password`, {
    reset_token: resetToken,
    password: password,
    password_confirmation: passwordConfirmation
  });
}
