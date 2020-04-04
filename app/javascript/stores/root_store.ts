import { observable, action } from 'mobx';
import SessionStore from './session_store';
import UserStore from './user_store';
import DbServerStore from './db_server_store';
import axios, { CancelTokenSource } from 'axios';
import RouterStore from './router_store';

export interface Store {
  cleanup: () => void;
}

export class RootStore implements Store {
  stores = observable<Store>([]);
  cancelToken: CancelTokenSource = axios.CancelToken.source();

  session: SessionStore;
  routing: RouterStore;
  user: UserStore;
  dbConnection: DbServerStore;

  @observable initialized = false;

  constructor() {
    this.routing = new RouterStore();
    this.stores.push(this.routing);

    this.session = new SessionStore(this, this.routing);
    this.stores.push(this.session);

    this.user = new UserStore(this);
    this.stores.push(this.user);

    this.dbConnection = new DbServerStore(this);
    this.stores.push(this.dbConnection);

    this.initialized = true;
  }

  @action
  cancelApiRequests() {
    this.cancelToken.cancel('Requests canceled');
    this.cancelToken = axios.CancelToken.source();
  }

  @action cleanup() {
    this.cancelApiRequests();
    this.stores.forEach((store) => store.cleanup());
  }
}

const instance = new RootStore();
(<any>window).store = instance;

export default instance;
