import { observable, reaction, computed, action } from 'mobx';
import { RootStore } from './root_store';
import {
  login,
  LoginUser as ApiLoginUser,
  logout,
  newPassword as setNewPasswordCall,
  user,
  deleteAccount as deleteAccountCall
} from '../api/user';
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

export enum PasswordState {
  Waiting, Error, Success, None
}

class SessionStore {
  @observable private user: User | null = null;
  browserHistory = createBrowserHistory();
  history: SynchronizedHistory;
  routeBeforeLogin: string | null = null;
  @observable passwordState: PasswordState = PasswordState.None;
  private readonly root: RootStore;

  constructor(root: RootStore, routerStore: RouterStore) {
    this.root = root;
    this.history = syncHistoryWithStore(this.browserHistory, routerStore);
    this.history.subscribe(this.onRouteChange);
    reaction(
      () => this.root.initialized,
      () => {
        this.setCurrentUser(this.fetchFromLocalStorage);

        // If a request comes back unauthorized,
        // log the user out
        const that = this;
        api.interceptors.response.use(
          (response) => {
            return response;
          },
          (error) => {
            if (error.response.status === 401) {
              this.resetAuthorization();
            }
            return Promise.reject(error);
          }
        );
      }
    );
    reaction(
      () => this.passwordState,
      (state) => {
        if (![PasswordState.None, PasswordState.Waiting].includes(state)) {
          this.passwordState = PasswordState.None;
        }
      },
      { delay: 5000 }
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

  get fetchFromLocalStorage(): ApiLoginUser | null {
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
    this.passwordState = PasswordState.Waiting;
    login(email, password).then(({ data }) => {
      this.setCurrentUser(data);
      this.passwordState = PasswordState.Success;
    }).catch((error) => {
      console.log('Loginfehler!!');
      this.passwordState = PasswordState.Error;
    });
  }

  @action setNewPassword(
    oldPassword: string,
    newPassword: string,
    newPasswordConfirmation: string
  ) {
    this.passwordState = PasswordState.Waiting;
    setNewPasswordCall(
      oldPassword,
      newPassword,
      newPasswordConfirmation
    ).then(({ data }) => {
      this.updateLocalUserCredentials(data);
      this.user = new User(data);
      this.passwordState = PasswordState.Success;
    }).catch(() => {
      this.passwordState = PasswordState.Error;
    });
  }

  @action reloadUser() {
    user().then(({ data }) => {
      const user = this.fetchFromLocalStorage;
      const updated = _.merge(
        user,
        _.pickBy(data, v => v !== null && v !== undefined)
      );
      if (!user) return;
      localStorage.setItem(
        LocalStorageKey.User,
        JSON.stringify(updated)
      );
      this.user = new User(data);
    }).catch(() => {
      this.resetAuthorization();
    });
  }

  @action logout() {
    logout().catch(({ error }) => {
      console.log(error);
    }).then(() => {
      this.resetAuthorization();
    });
  }

  @action deleteAccount(password: string) {
    this.passwordState = PasswordState.Waiting;
    deleteAccountCall(password).then(
      () => {
        this.resetAuthorization();
        this.passwordState = PasswordState.Success;
        this.history.push('/login');
      }
    ).catch((e) => {
      this.passwordState = PasswordState.Error;
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

  @action setCurrentUser(user: ApiLoginUser | null) {
    if (user === null) {
      this.user = null;
      return;
    }

    this.user = new User(user);

    api.defaults.headers[LocalStorageKey.Authorization] = user.token;
    api.defaults.headers[LocalStorageKey.CryptoKey] = user.crypto_key;
    localStorage.setItem(LocalStorageKey.User, JSON.stringify(user));

    // when the user came from the local storage, we must update the user
    // with the current data
    this.reloadUser();
    this.history.push(this.routeBeforeLogin || '/dashboard');
  }

  private updateLocalUserCredentials(user: ApiLoginUser) {
    api.defaults.headers[LocalStorageKey.Authorization] = user.token;
  }

}

export default SessionStore;