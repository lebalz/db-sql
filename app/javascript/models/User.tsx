import { observable, action, computed } from 'mobx';
import { User as UserProps } from '../api/user';

export enum Role {
  Admin = 'admin',
  User = 'user'
}
export default class User {
  readonly id: string;
  readonly email: string;
  readonly createdAt: Date;
  readonly role: Role;
  @observable loginCount: number;
  @observable lastLogin: Date;
  @observable updatedAt: Date;

  constructor(props: UserProps) {
    this.id = props.id;
    this.email = props.email;
    this.loginCount = props.login_count;
    this.lastLogin = new Date(props.last_login);
    this.createdAt = new Date(props.created_at);
    this.updatedAt = new Date(props.updated_at);
    this.role = props.role;
  }

  @action updateWithUserProps(user: UserProps) {
    this.updatedAt = new Date(user.updated_at);
    this.lastLogin = new Date(user.last_login);
    this.loginCount = user.login_count;
  }

  @computed get isAdmin() {
    return this.role === Role.Admin;
  }

  static formatDate(date: Date) {
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  }
}
