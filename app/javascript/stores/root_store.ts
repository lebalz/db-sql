import { observable } from 'mobx';
import { RouterStore } from 'mobx-react-router';
import SessionStore from './session_store';

export class RootStore {
  stores = observable<any>([]);

  session: SessionStore;
  routing: RouterStore;

  @observable initialized = false;

  constructor() {
    this.routing = new RouterStore();
    this.stores.push(this.routing);

    this.session = new SessionStore(this, this.routing);
    this.stores.push(this.session);

    this.initialized = true;
  }
}

const instance = new RootStore();
(<any>window).store = instance;

export default instance;