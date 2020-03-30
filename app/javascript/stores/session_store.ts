import { observable, reaction, computed, action } from 'mobx';
import { RootStore } from './root_store';
import {
  login,
  LoginUser as ApiLoginUser,
  logout,
  newPassword as setNewPasswordCall,
  user,
  deleteAccount as deleteAccountCall,
  resendActivationLink as resendActivationLinkCall
} from '../api/user';
import api from '../api/base';
import { createBrowserHistory, Action, Location } from 'history';
import {
  SynchronizedHistory,
  RouterStore,
  syncHistoryWithStore
} from 'mobx-react-router';
import User from '../models/User';
import _ from 'lodash';

export enum LocalStorageKey {
  User = 'db-sql-current-user',
  Authorization = 'Authorization',
  CryptoKey = 'Crypto-Key'
}

export enum RequestState {
  Waiting,
  Error,
  Success,
  None
}

interface Route {
  path?: string;
  query?: string;
}

class SessionStore {
  @observable private user: User | null = null;
  browserHistory = createBrowserHistory();
  history: SynchronizedHistory;
  routeBeforeLogin: Route = {};
  @observable passwordState: RequestState = RequestState.None;
  @observable resendActivationLinkState: RequestState = RequestState.None;
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
        if (![RequestState.None, RequestState.Waiting].includes(state)) {
          this.passwordState = RequestState.None;
        }
      },
      { delay: 5000 }
    );
  }

  isNoLoginRequired(location: Location) {
    return (
      location.pathname === '/login' ||
      /users\/.*\/reset_password/.test(location.pathname) ||
      /users\/.*\/activate/.test(location.pathname)
    );
  }

  get route(): Route {
    const { location } = this.history;
    return {
      path: location.pathname,
      query: location.search
    };
  }

  onRouteChange = (location: Location, action: Action) => {
    if (!this.isLoggedIn && !this.isNoLoginRequired(location)) {
      this.routeBeforeLogin = this.route;
      this.history.replace('/login');
    } else if (this.isLoggedIn && location.pathname === '/login') {
      let { routeBeforeLogin } = this;
      if (routeBeforeLogin.path === '/login') {
        routeBeforeLogin = {};
      }
      this.history.replace({
        pathname: routeBeforeLogin.path || '/dashboard',
        search: routeBeforeLogin.query || ''
      });
    } else if (this.isNoLoginRequired(location) && !this.routeBeforeLogin.path) {
      this.routeBeforeLogin = this.route;
    }
  };

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
    this.passwordState = RequestState.Waiting;
    login(email, password)
      .then(({ data }) => {
        this.setCurrentUser(data);
        this.passwordState = RequestState.Success;
      })
      .catch((error) => {
        console.log('Loginfehler!!');
        this.passwordState = RequestState.Error;
      });
  }

  @action setNewPassword(
    oldPassword: string,
    newPassword: string,
    newPasswordConfirmation: string
  ) {
    this.passwordState = RequestState.Waiting;
    setNewPasswordCall(oldPassword, newPassword, newPasswordConfirmation)
      .then(({ data }) => {
        this.updateLocalUserCredentials(data);
        this.user = new User(data);
        this.passwordState = RequestState.Success;
      })
      .catch(() => {
        this.passwordState = RequestState.Error;
      });
  }

  @action reloadUser() {
    user()
      .then(({ data }) => {
        const user = this.fetchFromLocalStorage;
        const updated = _.merge(
          user,
          _.pickBy(data, (v) => v !== null && v !== undefined)
        );
        if (!user) return;
        localStorage.setItem(LocalStorageKey.User, JSON.stringify(updated));
        this.user = new User(data);
      })
      .catch(() => {
        if (this.isNoLoginRequired(this.root.routing.location)) return;

        this.resetAuthorization();
      });
  }

  @action logout() {
    logout()
      .catch(({ error }) => {
        console.log(error);
      })
      .then(() => {
        this.resetAuthorization();
      });
  }

  @action resendActivationLink() {
    this.resendActivationLinkState = RequestState.Waiting;
    resendActivationLinkCall()
      .then(() => {
        this.resendActivationLinkState = RequestState.Success;
      })
      .catch(() => {
        this.resendActivationLinkState = RequestState.Error;
      })
      .then((result) => new Promise((resolve) => setTimeout(resolve, 5000, result)))
      .finally(() => (this.resendActivationLinkState = RequestState.None));
  }

  @action deleteAccount(password: string) {
    this.passwordState = RequestState.Waiting;
    deleteAccountCall(password)
      .then(() => {
        this.resetAuthorization();
        this.passwordState = RequestState.Success;
        this.history.push('/login');
      })
      .catch((e) => {
        this.passwordState = RequestState.Error;
      });
  }

  @action resetAuthorization() {
    this.user = null;
    delete api.defaults.headers[LocalStorageKey.Authorization];
    delete api.defaults.headers[LocalStorageKey.CryptoKey];
    localStorage.removeItem(LocalStorageKey.User);
    this.routeBeforeLogin = {};
    this.history.replace('/login');
  }

  @action setCurrentUser(user: ApiLoginUser | null) {
    if (!user) {
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
    if (this.user.isAdmin) {
      this.root.user.loadUsers();
    }
    if (this.routeBeforeLogin.path === '/login') {
      this.routeBeforeLogin = {};
    }
    this.history.push({
      pathname: this.routeBeforeLogin.path || '/dashboard',
      search: this.routeBeforeLogin.query || ''
    });
  }

  private updateLocalUserCredentials(user: ApiLoginUser) {
    api.defaults.headers[LocalStorageKey.Authorization] = user.token;
  }
}

export default SessionStore;
