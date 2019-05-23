import { observable, reaction, computed, action } from 'mobx';
import { RootStore } from './root_store';
import { login, LoginUser as ApiLoginUser, User as ApiUser, logout, validate, newPassword as setNewPasswordCall } from '../api/user';
import api from '../api/base';
import { createBrowserHistory, Action, Location } from 'history';
import { SynchronizedHistory, RouterStore, syncHistoryWithStore } from 'mobx-react-router';
import User from '../models/User';
import _ from 'lodash';

export enum LocalStorageKey {
  User = 'db-sql-current-user',
  Authorization = 'Authorization',
  CryptoKey = 'Crypto-Key'
}

export enum NewPasswordState {
  Waiting, Error, Success, None
}

class SessionStore {
  @observable private user: User | null = null;
  browserHistory = createBrowserHistory();
  history: SynchronizedHistory;
  routeBeforeLogin: string | null = null;
  @observable newPasswordState: NewPasswordState = NewPasswordState.None;
  private readonly root: RootStore;

  constructor(root: RootStore, routerStore: RouterStore) {
    this.root = root;
    this.history = syncHistoryWithStore(this.browserHistory, routerStore);
    this.history.subscribe(this.onRouteChange);
    reaction(
      () => this.root.initialized,
      () => {
        this.setCurrentUser(this.fetchFromLocalStorage());

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

  onRouteChange = (location: Location, action: Action) => {
    if (!this.isLoggedIn && location.pathname !== '/login') {
      this.routeBeforeLogin = location.pathname;
      this.history.replace('/login');
    } else if (this.isLoggedIn && location.pathname === '/login') {
      this.history.replace(this.routeBeforeLogin || '/dashboard');
    }
  }

  fetchFromLocalStorage(): ApiLoginUser | null {
    const user = localStorage.getItem(LocalStorageKey.User);

    if (user !== null) {
      return JSON.parse(user);
    }
    return null;
  }

  @computed get currentUser() {
    if (!this.user) {
      throw new Error('No logged in User');
    }
    return this.user;
  }

  @computed get isLoggedIn() {
    return !!this.user;
  }

  @action login(email: string, password: string) {
    login(email, password).then(({ data }) => {
      this.setCurrentUser(data);
    }).catch(() => {
      console.log('Loginfehler!!');
    });
  }

  @action setNewPassword(
    oldPassword: string,
    newPassword: string,
    newPasswordConfirmation: string
  ) {
    this.newPasswordState = NewPasswordState.Waiting;
    setNewPasswordCall(
      oldPassword,
      newPassword,
      newPasswordConfirmation
    ).then(({ data }) => {
      this.updateLocalUserCredentials(data);
      this.pCurrentUser.updateWithUserProps(data);
      this.newPasswordState = NewPasswordState.Success;
    }).catch(() => {
      this.newPasswordState = NewPasswordState.Error;
    });
  }

  @action logout() {
    logout().catch(({ error }) => {
      console.log(error);
    }).then(() => {
      this.resetAuthorization();
    });
  }

  @action resetAuthorization() {
    this.user = null;
    delete api.defaults.headers[LocalStorageKey.Authorization];
    delete api.defaults.headers[LocalStorageKey.CryptoKey];
    localStorage.removeItem(LocalStorageKey.User);
    this.routeBeforeLogin = null;
    this.history.replace('/login');
  }

  @action setCurrentUser(user: LoginUser | null) {
    this.user = user;
    if (user === null) return;

    api.defaults.headers[LocalStorageKey.Authorization] = user.token;
    api.defaults.headers[LocalStorageKey.CryptoKey] = user.crypto_key;
    localStorage.setItem(LocalStorageKey.User, JSON.stringify(user));
    this.updateLocalUserCredentials(user);
    this.history.push(this.routeBeforeLogin || '/dashboard');
  }

  private updateLocalUserCredentials(user: ApiLoginUser) {
    api.defaults.headers[LocalStorageKey.Authorization] = user.token;
    api.defaults.headers[LocalStorageKey.CryptoKey] = user.crypto_key;
    localStorage.setItem(LocalStorageKey.User, JSON.stringify(user));
  }

}

export default SessionStore;