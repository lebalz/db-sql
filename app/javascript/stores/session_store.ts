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

const isAccountActivationPath = (location: Partial<Location>) => {
  if (!location.pathname) {
    return false;
  }

  // /users/id/activate
  return /^\/users\/.*\/activate$/.test(location.pathname);
};

const isResetPasswordPath = (location: Partial<Location>) => {
  if (!location.pathname) {
    return false;
  }

  // /users/id/reset_password
  return    /^\/users\/.*\/reset_password$/.test(location.pathname)
};

const isLoginPath = (location: Partial<Location>) => {
  if (!location.pathname) {
    return false;
  }

  // '/login'
  return /^\/login$/.test(location.pathname);
};

const isNoLoginRequired = (location: Partial<Location>) => {
  if (!location.pathname) {
    return false;
  }
  return (
    isLoginPath(location) ||
    isAccountActivationPath(location) ||
    isResetPasswordPath(location)
  );
};

class SessionStore {
  @observable private user: User | null = null;
  browserHistory = createBrowserHistory();
  history: SynchronizedHistory;
  routeBeforeLogin: Partial<Location> = {};
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

  get route(): Partial<Location> {
    const { location } = this.history;
    return {
      pathname: location.pathname,
      search: location.search
    };
  }

  @computed
  get defaultLocation(): Partial<Location> {
    const hasPath = !!this.routeBeforeLogin.pathname;
    return {
      pathname: this.routeBeforeLogin.pathname ?? '/dashboard',
      search: (hasPath && this.routeBeforeLogin.search) ? this.routeBeforeLogin.search : ''
    };
  }

  authorize(location: Partial<Location>) {
    if (this.isLoggedIn) {
      return true;
    }
    if (isNoLoginRequired(location)) {
      return true;
    }
    return false;
  }

  onRouteChange = (location: Location, action: Action) => {
    if (!this.authorize(location)) {
      this.routeBeforeLogin = this.route;
      return this.history.replace('/login');
    }

    if (this.isLoggedIn && isLoginPath(location)) {
      if (isNoLoginRequired(this.routeBeforeLogin)) {
        this.routeBeforeLogin = {};
      }

      this.history.replace(this.defaultLocation);
      return;
    }

    if (isNoLoginRequired(location) && !this.routeBeforeLogin.pathname) {
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
        if (isNoLoginRequired(this.root.routing.location)) {
          return;
        }

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

    if (isNoLoginRequired(this.routeBeforeLogin)) {
      if (!this.user.activated && isAccountActivationPath(this.routeBeforeLogin)) {
        return;
      }
      this.routeBeforeLogin = {};
    }

    this.history.push(this.defaultLocation);
  }

  private updateLocalUserCredentials(user: ApiLoginUser) {
    api.defaults.headers[LocalStorageKey.Authorization] = user.token;
  }
}

export default SessionStore;
