import { observable, reaction, computed, action, toJS, $mobx } from 'mobx';
import { RootStore, Store } from './root_store';
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
import { SynchronizedHistory, RouterStore, syncHistoryWithStore } from 'mobx-react-router';
import { matchPath } from 'react-router';
import User from '../models/User';
import _ from 'lodash';

export enum LocalStorageKey {
  User = 'db-sql-current-user',
  Authorization = 'Authorization',
  CryptoKey = 'Crypto-Key'
}

export enum ApiRequestState {
  Waiting = 0,
  Error = 1,
  Success = 2,
  None = 3
}

export enum ApiLoginRequestState {
  ActivationPeriodExpired = 4
}

interface RequestState {
  state: ApiRequestState;
  message: string;
}

interface LoginRequestState {
  state: ApiRequestState | ApiLoginRequestState;
  message: string;
}

const LOGIN_PATH = '/login';

const USER_PATH_REGEXP = '/users/:id/(.*)';

const ACCOUNT_ACTIVATION_REGEXP = '/users/:id/activate';

const RESET_PASSWORD_REGEXP = '/users/:id/reset_password';

const isNoLoginRequired = (pathname: string) => {
  return !!matchPath(pathname, [LOGIN_PATH, ACCOUNT_ACTIVATION_REGEXP, RESET_PASSWORD_REGEXP]);
};

const isLoginRequired = (pathname: string) => {
  return !isNoLoginRequired(pathname);
};

class SessionStore implements Store {
  @observable private user: User | null = null;
  @observable emailOfLastLoginAttempt?: string;
  browserHistory = createBrowserHistory();
  history: SynchronizedHistory;
  @observable loginState: LoginRequestState = { state: ApiRequestState.None, message: '' };
  @observable passwordState: RequestState = { state: ApiRequestState.None, message: '' };
  @observable resendActivationLinkState: RequestState = { state: ApiRequestState.None, message: '' };
  private readonly root: RootStore;
  private locationHistory: Location[] = [];

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
      () => this.loginState.state,
      (state) => {
        if (
          ![
            ApiRequestState.None,
            ApiRequestState.Waiting,
            ApiLoginRequestState.ActivationPeriodExpired
          ].includes(state)
        ) {
          this.loginState.state = ApiRequestState.None;
        }
      },
      { delay: 5000 }
    );
  }

  get route(): Location {
    const { location } = this.history;
    return location;
  }

  authorize(pathname: string) {
    if (this.isLoggedIn) {
      const match = matchPath<{ id: string }>(pathname, [USER_PATH_REGEXP]);
      if (match && match.params.id !== this.currentUser.id) {
        return false;
      }
      return true;
    }

    if (isNoLoginRequired(pathname)) {
      return true;
    }

    return false;
  }

  onRouteChange = (location: Location, action: Action) => {
    this.pushToHistory(location, action);
    if (!this.authorize(location.pathname)) {
      if (this.isLoggedIn) {
        this.cleanLocalStorage();
        return this.logout(false);
      }
      return this.history.push('/login');
    }

    this.navigateToNextOrDefaultPage();
  };

  @action navigateToNextOrDefaultPage() {
    const { route } = this;
    let proceed = true;
    if (this.isLoggedIn) {
      if (matchPath(route.pathname, LOGIN_PATH)) {
        const historyLength = this.locationHistory.length;
        if (historyLength > 1) {
          const lastLocation = this.locationHistory[historyLength - 2];
          if (this.authorize(lastLocation.pathname) && isLoginRequired(lastLocation.pathname)) {
            return this.history.push(lastLocation);
          }
        }
        proceed = false;
      }
      if (
        // dont proceed on activation request for activated users
        matchPath(route.pathname, ACCOUNT_ACTIVATION_REGEXP) &&
        this.currentUser.activated
      ) {
        proceed = false;
      }
      if (
        // dont proceed on reset requests for users without a requested password reset
        matchPath(route.pathname, RESET_PASSWORD_REGEXP) &&
        !this.currentUser.passwordResetRequested
      ) {
        proceed = false;
      }
    }
    if (proceed) {
      return;
    }
    this.history.push('/dashboard');
  }

  pushToHistory = (location: Location, action: Action) => {
    switch (action) {
      case 'POP':
        this.locationHistory = [];
      case 'PUSH':
        break;
      case 'REPLACE':
        if (this.locationHistory.length > 0) {
          this.locationHistory.pop();
        }
        break;
    }
    this.locationHistory.push(toJS(location));
  };

  lastRouteContext(route: string, alternativeRoute?: string): string {
    return (
      this.locationHistory.slice().reverse().find((location) => location.pathname.startsWith(route))?.pathname ??
      `${route}/${alternativeRoute}`
    );
  }

  get fetchFromLocalStorage(): ApiLoginUser | null {
    const user = localStorage.getItem(LocalStorageKey.User);

    if (user !== null) {
      return JSON.parse(user);
    }
    return null;
  }

  @computed get currentUser(): User {
    if (!this.user) {
      throw new Error('No logged in User');
    }
    return this.user;
  }

  @computed get isLoggedIn() {
    return !!this.user;
  }

  @action login(email: string, password: string) {
    this.loginState.state = ApiRequestState.Waiting;
    this.emailOfLastLoginAttempt = email;
    login(email, password)
      .then(({ data }) => {
        this.setCurrentUser(data);
        this.loginState.state = ApiRequestState.Success;
      })
      .catch((error) => {
        if (error?.response?.status === 403) {
          this.loginState.state = ApiLoginRequestState.ActivationPeriodExpired;
          this.loginState.message = error.response.data.error;
        } else {
          this.loginState.state = ApiRequestState.Error;
          this.loginState.message = error.response.data.error;
        }
      });
  }

  @action setNewPassword(oldPassword: string, newPassword: string, newPasswordConfirmation: string) {
    this.loginState.state = ApiRequestState.Waiting;
    setNewPasswordCall(oldPassword, newPassword, newPasswordConfirmation)
      .then(({ data }) => {
        this.updateLocalUserCredentials(data);
        this.user = new User(data);
        this.passwordState.state = ApiRequestState.Success;
      })
      .catch((error) => {
        this.passwordState.state = ApiRequestState.Error;
        this.passwordState.message = error.response.data.error;
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
        this.resetAuthorization(false);
      });
  }

  @action logout(redirect: boolean = true) {
    return logout()
      .catch(({ error }) => {
        console.log(error);
      })
      .then(() => {
        this.resetAuthorization(redirect);
        this.root.cleanup();
      });
  }

  @action resendActivationLink(email: string = this.currentUser.email) {
    this.resendActivationLinkState.state = ApiRequestState.Waiting;
    resendActivationLinkCall(email)
      .then(() => {
        this.resendActivationLinkState.state = ApiRequestState.Success;
      })
      .catch((error) => {
        this.resendActivationLinkState.state = ApiRequestState.Error;
        this.resendActivationLinkState.message = error.response.data.error;
      })
      .then((result) => new Promise((resolve) => setTimeout(resolve, 5000, result)))
      .finally(() => (this.resendActivationLinkState.state = ApiRequestState.None));
  }

  @action deleteAccount(password: string) {
    this.loginState.state = ApiRequestState.Waiting;
    deleteAccountCall(password)
      .then(() => {
        this.resetAuthorization();
        this.loginState.state = ApiRequestState.Success;
        this.history.push('/login');
      })
      .catch((e) => {
        this.loginState.state = ApiRequestState.Error;
      });
  }

  @action resetAuthorization(redirect: boolean = true) {
    this.user = null;
    delete api.defaults.headers[LocalStorageKey.Authorization];
    delete api.defaults.headers[LocalStorageKey.CryptoKey];
    this.cleanLocalStorage();
    if (redirect) {
      this.history.push('/login');
    }
  }

  @action cleanLocalStorage() {
    localStorage.removeItem(LocalStorageKey.User);
  }

  @action setCurrentUser(user: ApiLoginUser | null) {
    if (!user) {
      this.user = null;
      return;
    }

    this.user = new User(user);
    api.defaults.headers[LocalStorageKey.Authorization] = user.token;
    api.defaults.headers[LocalStorageKey.CryptoKey] = user.crypto_key;
    if (!this.authorize(this.route.pathname)) {
      return this.logout(false);
    }

    localStorage.setItem(LocalStorageKey.User, JSON.stringify(user));

    // when the user came from the local storage, we must update the user
    // with the current data
    this.reloadUser();
    if (this.user.isAdmin) {
      this.root.user.loadUsers();
    } else {
      this.root.user.cleanup();
    }
    this.root.user.loadGroupUsers();

    this.navigateToNextOrDefaultPage();
  }

  @action cleanup() {}

  private updateLocalUserCredentials(user: ApiLoginUser) {
    api.defaults.headers[LocalStorageKey.Authorization] = user.token;
  }
}

export default SessionStore;
