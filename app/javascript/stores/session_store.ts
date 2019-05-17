import { observable, reaction, computed, action } from 'mobx';
import { RootStore } from './root_store';
import { login, LoginUser, User } from '../api/user';
import api from '../api/base';

class SessionStore {
  @observable currentUser: User | null = null;
  private readonly root: RootStore;

  constructor(root: RootStore) {
    this.root = root;
    reaction(
      () => this.root.initialized,
      initialized => console.log('Initialized: ', initialized)
    );
  }

  @computed get isLoggedIn() {
    return !!this.currentUser;
  }

  @action login(email: string, password: string) {
    login(email, password).then(({ data }) => {
      this.setCurrentUser(data);
    }).catch(() => {
      console.log('Loginfehler!!');
    });
  }

  @action setCurrentUser(user: LoginUser) {
    this.currentUser = user;
    if (user === null) return;

    api.defaults.headers['Authorization'] = user.token;
    api.defaults.headers['Crypto-Key'] = user.crypto_key;
    localStorage.setItem('db-sql-current-user', JSON.stringify(user));
  }

}

export default SessionStore;