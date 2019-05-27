import { observable, reaction, computed, action } from 'mobx';
import { RootStore } from './root_store';
import User from '../models/User';
import _ from 'lodash';
import { users } from '../api/admin';

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

  @action loadUsers(forceReload: boolean = false) {
    if (!forceReload && this.users.length > 0) return;

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

}

export default UserStore;