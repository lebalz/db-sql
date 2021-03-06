import { observable, action } from 'mobx';
import SessionStore from './session_store';
import UserStore from './user_store';
import DbServerStore from './db_server_store';
import axios, { CancelTokenSource } from 'axios';
import RouterStore from './router_store';
import StatusStore from './status_store';
import ViewStateStore from './view_state_store';
import SchemaQueryStore from './schema_query_store';
import GroupStore from './group_store';
import SqlQueryStore from './sql_query_store';

export interface Store {
  cleanup: () => void;
}

export class RootStore implements Store {
  stores = observable<Store>([]);
  cancelToken: CancelTokenSource = axios.CancelToken.source();

  session: SessionStore;
  routing: RouterStore;
  user: UserStore;
  dbServer: DbServerStore;
  statusStore: StatusStore;
  viewStateStore: ViewStateStore;
  schemaQueryStore: SchemaQueryStore;
  groupStore: GroupStore;
  sqlQueryStore: SqlQueryStore;

  @observable initialized = false;

  constructor() {
    this.routing = new RouterStore();
    this.stores.push(this.routing);

    this.session = new SessionStore(this, this.routing);
    this.stores.push(this.session);

    this.user = new UserStore(this);
    this.stores.push(this.user);

    this.dbServer = new DbServerStore(this);
    this.stores.push(this.dbServer);

    this.statusStore = new StatusStore(this);
    this.stores.push(this.dbServer);

    this.viewStateStore = new ViewStateStore(this);
    this.stores.push(this.viewStateStore);

    this.schemaQueryStore = new SchemaQueryStore(this);
    this.stores.push(this.schemaQueryStore);

    this.groupStore = new GroupStore(this);
    this.stores.push(this.groupStore);

    this.sqlQueryStore = new SqlQueryStore(this);
    this.stores.push(this.sqlQueryStore);

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
