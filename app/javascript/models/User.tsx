import { observable, action } from 'mobx';
import { User as UserProps } from '../api/user';

export default class User {
  readonly id: string;
  readonly email: string;
  readonly createdAt: Date;
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
  }

  @action updateWithUserProps(user: UserProps) {
    this.updatedAt = new Date(user.updated_at);
    this.lastLogin = new Date(user.last_login);
    this.loginCount = user.login_count;
    console.log(user.login_count);
  }
}
