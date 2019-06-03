import { observable } from 'mobx';
import { RouterStore } from 'mobx-react-router';
import SessionStore from './session_store';
import UserStore from './user_store';
import DbConnectionStore from './db_connection_store';

export class RootStore {
  stores = observable<any>([]);

  session: SessionStore;
  routing: RouterStore;
  user: UserStore;
  dbConnection: DbConnectionStore;

  @observable initialized = false;

  constructor() {
    this.routing = new RouterStore();
    this.stores.push(this.routing);

    this.session = new SessionStore(this, this.routing);
    this.stores.push(this.session);

    this.user = new UserStore(this);
    this.stores.push(this.user);

    this.dbConnection = new DbConnectionStore(this);
    this.stores.push(this.dbConnection);

    this.initialized = true;
  }
}

const instance = new RootStore();
(<any>window).store = instance;

export default instance;