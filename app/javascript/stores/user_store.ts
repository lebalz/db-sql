import { observable, reaction, computed, action } from 'mobx';
import { RootStore } from './root_store';
import User from '../models/User';
import _ from 'lodash';
import { users } from '../api/admin';

class UserStore {
  routeBeforeLogin: string | null = null;
  private readonly root: RootStore;
  users = observable<User>([]);

  constructor(root: RootStore) {
    this.root = root;
  }

  @action loadUsers(forceReload: boolean = false) {
    if (!forceReload && this.users.length > 0) return;

    users().then(({ data }) => {
      const users = data.map(user => new User(user));
      this.users.replace(users);
    }).catch(() => {
      console.log('No admin authorization');
      this.users.replace([]);
    });
  }

}

export default UserStore;