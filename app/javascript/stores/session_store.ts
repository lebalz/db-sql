import { observable, reaction, computed, action } from 'mobx';
import { RootStore } from './root_store';
import { login, LoginUser, User, logout } from '../api/user';
import api from '../api/base';

class SessionStore {
  @observable pCurrentUser: User | null = null;
  private readonly root: RootStore;

  constructor(root: RootStore) {
    this.root = root;
    reaction(
      () => this.root.initialized,
      initialized => console.log('Initialized: ', initialized)
    );
  }

  @computed get currentUser() {
    if (!this.pCurrentUser) {
      throw new Error('No logged in User');
    }
    return this.pCurrentUser;
  }

  @computed get isLoggedIn() {
    return !!this.pCurrentUser;
  }

  @action login(email: string, password: string) {
    login(email, password).then(({ data }) => {
      this.setCurrentUser(data);
    }).catch(() => {
      console.log('Loginfehler!!');
    });
  }

  @action logout() {
    logout().catch(({ error }) => {
      console.log(error);
    }).then(() => {
      this.resetAuthorization();
    });
  }

  resetAuthorization() {
    this.pCurrentUser = null;
    delete api.defaults.headers['Authorization'];
    delete api.defaults.headers['Crypto-Key'];
    localStorage.removeItem('db-sql-current-user');
  }

  @action setCurrentUser(user?: LoginUser) {
    this.pCurrentUser = user;
    if (user === null) return;

    api.defaults.headers['Authorization'] = user.token;
    api.defaults.headers['Crypto-Key'] = user.crypto_key;
    localStorage.setItem('db-sql-current-user', JSON.stringify(user));
  }

}

export default SessionStore;