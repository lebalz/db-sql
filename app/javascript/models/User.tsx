import { observable, computed } from 'mobx';
import { User as UserProps } from '../api/user';
import _ from 'lodash';

export enum Role {
  Admin = 'admin',
  User = 'user'
}
export default class User {
  readonly id: string;
  readonly email: string;
  readonly createdAt: Date;
  readonly role: Role;
  readonly activated: boolean;
  readonly passwordResetRequested: boolean;
  @observable queryCount: number;
  @observable errorQueryCount: number;
  @observable loginCount: number;
  @observable updatedAt: Date;

  constructor(props: UserProps) {
    this.id = props.id;
    this.email = props.email;
    this.loginCount = props.login_count;
    this.createdAt = new Date(props.created_at);
    this.updatedAt = new Date(props.updated_at);
    this.activated = props.activated;
    this.role = props.role;
    this.queryCount = props.query_count;
    this.errorQueryCount = props.error_query_count;
    this.passwordResetRequested = props.password_reset_requested;
  }

  @computed get isAdmin() {
    return this.role === Role.Admin;
  }

  static formatDate(date: Date) {
    return date.toLocaleString();
  }

  @computed
  get props(): UserProps {
    return {
      id: this.id,
      email: this.email,
      login_count: this.loginCount,
      created_at: this.createdAt.toISOString(),
      updated_at: this.updatedAt.toISOString(),
      activated: this.activated,
      role: this.role,
      query_count: this.queryCount,
      error_query_count: this.errorQueryCount,
      password_reset_requested: this.passwordResetRequested
    };
  }
}
