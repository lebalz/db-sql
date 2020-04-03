import { observable, action, computed } from 'mobx';
import { RootStore } from './root_store';
import User from '../models/User';
import _ from 'lodash';
import {
  users,
  deleteUser,
  updateUser as apiUpdate,
  user as apiUser
} from '../api/admin';

export enum ReloadState {
  None,
  Loading,
  Success,
  Error
}

class State {
  users = observable<User>([]);
  @observable reloadState = ReloadState.None;
}

class UserStore {
  private readonly root: RootStore;
  @observable.ref
  private state = new State();

  constructor(root: RootStore) {
    this.root = root;
  }

  @action loadUsers() {
    this.state.reloadState = ReloadState.Loading;
    users(this.root.cancelToken)
      .then(({ data }) => {
        const users = _.sortBy(data, ['email']).map((user) => new User(user));
        this.state.users.replace(users);
        this.state.reloadState = ReloadState.Success;
      })
      .catch(() => {
        console.log('No admin authorization');
        this.state.users.replace([]);
        this.state.reloadState = ReloadState.Error;
      })
      .then((result) => new Promise((resolve) => setTimeout(resolve, 2000, result)))
      .finally(() => (this.state.reloadState = ReloadState.None));
  }

  @action updateUser(id: string, update: Partial<User>) {
    apiUpdate(id, update, this.root.cancelToken)
      .then(() => apiUser(id, this.root.cancelToken))
      .then(({ data }) => {
        const oldUser = this.state.users.find((user) => user.id === id);
        if (!oldUser) return;

        this.state.users.remove(oldUser);
        this.state.users.push(new User(data));
      })
      .catch((e) => console.log(e));
  }

  @action deleteUser(id: string) {
    deleteUser(id, this.root.cancelToken)
      .then(() => {
        const user = this.state.users.find((user) => user.id === id);
        user && this.state.users.remove(user);
      })
      .catch((error) => {
        console.log(error);
      });
  }

  @computed
  get reloadState() {
    return this.state.reloadState;
  }

  @computed
  get users() {
    return this.state.users;
  }

  @action cleanup() {
    this.state = new State();
  }
}

export default UserStore;
