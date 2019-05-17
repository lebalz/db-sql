import { observable } from 'mobx';
import SessionStore from './session_store';

export class RootStore {
  stores = observable<any>([]);

  session: SessionStore;

  @observable initialized = false;

  constructor() {
    this.session = new SessionStore(this);
    this.stores.push(this.session)

    this.initialized = true;
  }
}

const instance = new RootStore();
(<any>window).store = instance;

export default instance;