import api from './base';
import { AxiosPromise } from 'axios';
import { Role } from '../models/User';

export interface User {
  id: string;
  email: string;
  login_count: number;
  role: Role;
  activated: boolean;
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

export function user(): AxiosPromise<User> {
  return api.get('user');
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

export function resendActivationLink() {
  return api.post(
    'user/resend_activation_link'
  );
}

export function deleteAccount(password: string) {
  return api.delete(
    'user',
    {
      data: {
        password: password
      }
    }
  );
}

export function activateAccount(id: string, activationToken: string) {
  return api.put(
    `user/${id}/activate`,
    {
      activation_token: activationToken
    }
  );
}

export function requestPasswordReset(email: string) {
  return api.post(
    'user/reset_password',
    {
      email: email
    }
  );
}

export function resetPassword(
  id: string,
  resetToken: string,
  password: string,
  passwordConfirmation: string
) {
  return api.post(
    `user/${id}/reset_password`,
    {
      reset_token: resetToken,
      password: password,
      password_confirmation: passwordConfirmation
    }
  );
}