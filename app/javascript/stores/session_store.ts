import { observable, reaction, computed, action } from 'mobx';
import { RootStore } from './root_store';
import { login, LoginUser, User, logout, validate } from '../api/user';
import api from '../api/base';

export enum LocalStorageKey {
  User = 'db-sql-current-user',
  Authorization = 'Authorization',
  CryptoKey = 'Crypto-Key'
}

class SessionStore {
  @observable pCurrentUser: User | null = null;
  private readonly root: RootStore;

  constructor(root: RootStore) {
    this.root = root;
    reaction(
      () => this.root.initialized,
      () => {
        this.setCurrentUser(SessionStore.fetchFromLocalStorage());

        // If a request comes back unauthorized,
        // log the user out
        const that = this;
        api.interceptors.response.use(
          (response) => {
            return response;
          },
          (error) => {
            if (error.response.status === 401) {
              that.resetAuthorization();
            }
            return Promise.reject(error);
          }
        );
      }
    );
  }

  static fetchFromLocalStorage(): LoginUser | null {
    const user = localStorage.getItem(LocalStorageKey.User);

    if (user !== null) {
      return JSON.parse(user);
    }
    return null;
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
    delete api.defaults.headers[LocalStorageKey.Authorization];
    delete api.defaults.headers[LocalStorageKey.CryptoKey];
    localStorage.removeItem(LocalStorageKey.User);
  }

  @action setCurrentUser(user?: LoginUser) {
    this.pCurrentUser = user;
    if (user === null) return;

    api.defaults.headers[LocalStorageKey.Authorization] = user.token;

    // validate that the used token is from this user.
    // else reset authorization
    validate(user).then(({ data }) => {
      if (data.valid) {
        api.defaults.headers[LocalStorageKey.CryptoKey] = user.crypto_key;
        localStorage.setItem(LocalStorageKey.User, JSON.stringify(user));
      } else {
        this.resetAuthorization();
      }
    }).catch((error) => {
      console.log(error);
      this.resetAuthorization();
    });
  }

}

export default SessionStore;