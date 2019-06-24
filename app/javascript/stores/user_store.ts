import { observable, action } from 'mobx';
import { RootStore } from './root_store';
import User from '../models/User';
import _ from 'lodash';
import { users, deleteUser, updateUser as apiUpdate, user as apiUser } from '../api/admin';

export enum ReloadState {
  None, Loading, Success, Error
}

class UserStore {
  routeBeforeLogin: string | null = null;
  private readonly root: RootStore;
  users = observable<User>([]);
  @observable reloadState = ReloadState.None;

  constructor(root: RootStore) {
    this.root = root;
  }

  @action loadUsers() {
    this.reloadState = ReloadState.Loading;
    users().then(({ data }) => {
      const users = _.sortBy(data, ['email']).map(user => new User(user));
      this.users.replace(users);
      this.reloadState = ReloadState.Success;
    }).catch(() => {
      console.log('No admin authorization');
      this.users.replace([]);
      this.reloadState = ReloadState.Error;
    }).then(
      result => new Promise(resolve => setTimeout(resolve, 2000, result))
    ).finally(
      () => this.reloadState = ReloadState.None
    );
  }

  @action updateUser(id: string, update: Partial<User>) {
    apiUpdate(id, update).then(
      () => apiUser(id)
    ).then(
      ({ data }) => {
        const oldUser = this.users.find(user => user.id === id);
        if (!oldUser) return;

        this.users.remove(oldUser);
        this.users.push(
          new User(data)
        );
      }
    ).catch(
      e => console.log(e)
    );
  }

  @action deleteUser(id: string) {
    deleteUser(id).then(() => {
      const user = this.users.find(user => user.id === id);
      user && this.users.remove(user);
    }).catch((error) => {
      console.log(error);
    });
  }

}

export default UserStore;