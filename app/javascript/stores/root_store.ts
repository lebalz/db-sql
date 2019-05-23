import { observable } from 'mobx';
import { RouterStore } from 'mobx-react-router';
import SessionStore from './session_store';
import UserStore from './user_store';

export class RootStore {
  stores = observable<any>([]);

  session: SessionStore;
  routing: RouterStore;
  user: UserStore;

  @observable initialized = false;

  constructor() {
    this.routing = new RouterStore();
    this.stores.push(this.routing);

    this.session = new SessionStore(this, this.routing);
    this.stores.push(this.session);

    this.user = new UserStore(this);
    this.stores.push(this.user);

    this.initialized = true;
  }
}

const instance = new RootStore();
(<any>window).store = instance;

export default instance;