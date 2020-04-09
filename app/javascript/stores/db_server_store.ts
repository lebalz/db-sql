import { observable, action, reaction, computed, IReactionDisposer } from 'mobx';
import { RootStore, Store } from './root_store';
import _ from 'lodash';
import {
  dbServers,
  updateDbServer,
  createDbServer,
  remove as removeApi,
  query as fetchQuery,
  databases,
  database
} from '../api/db_server';
import DbServer from '../models/DbServer';
import { TempDbServer } from '../models/TempDbServer';
import 'regenerator-runtime/runtime';
import { REST } from '../declarations/REST';
import { RequestState } from './session_store';
import Database from '../models/Database';
import Query, { PlaceholderQuery } from '../models/Query';

export enum LoadState {
  Loading,
  Error,
  Success,
  None
}

class State {
  dbServers = observable<DbServer>([]);
  @observable activeDbServerId: string = '';
  databaseIndex = observable(new Map<string, string[]>());
  activeDatabase = observable(new Map<string, string>());
  databases = observable(new Map<string, Map<string, Database>>());

  databaseTreeViewFilter = observable(new Map<string, string>());

  @observable tempDbServer?: TempDbServer = undefined;

  @observable loadState: LoadState = LoadState.None;
  @observable dbIndexLoadState: LoadState = LoadState.None;
  @observable saveState: RequestState = RequestState.None;

  @observable queryState: RequestState = RequestState.None;
}

class DbServerStore implements Store {
  private readonly root: RootStore;
  @observable.ref
  private state = new State();

  loginDisposer: IReactionDisposer;
  dbIndexLoader: IReactionDisposer;
  currentDbLoader: IReactionDisposer;

  constructor(root: RootStore) {
    this.root = root;

    this.loginDisposer = reaction(
      () => this.root.session.isLoggedIn,
      (loggedIn) => {
        if (loggedIn) {
          this.loadDbServers(true);
        }
      }
    );

    // load the database index if it is not loaded
    this.dbIndexLoader = reaction(
      () => this.state.activeDbServerId,
      (activeDbServerId) => {
        if (activeDbServerId) {
          this.loadDatabaseIndex(activeDbServerId);
        }
      }
    );

    // load the current database if it is not loaded
    this.currentDbLoader = reaction(
      () => this.activeDbServer?.activeDatabaseKey,
      (activeDatabaseKey) => {
        if (activeDatabaseKey) {
          const { activeDbServerId } = this.state;
          if (this.activeDatabase(activeDbServerId)) {
            return;
          }

          const dbName = this.state.activeDatabase.get(activeDbServerId);
          if (dbName) {
            this.loadDatabase(activeDbServerId, dbName);
          }
        }
      }
    );
  }

  componentWillUnmount() {
    this.loginDisposer();
    this.dbIndexLoader();
    this.currentDbLoader();
  }

  databaseTreeViewFilter(dbServerId: string): string {
    if (!this.state.databaseTreeViewFilter.has(dbServerId)) {
      this.state.databaseTreeViewFilter.set(dbServerId, '');
    }
    return this.state.databaseTreeViewFilter.get(dbServerId)!;
  }

  @action
  setDatabaseTreeViewFilter(dbServerId: string, filter: string) {
    this.state.databaseTreeViewFilter.set(dbServerId, filter);
  }

  @computed
  get loadedDbServers(): DbServer[] {
    return Array.from(this.state.databaseIndex.keys()).map((id) => this.dbServer(id)!);
  }

  dbServer(id: string): DbServer | undefined {
    return this.state.dbServers.find((c) => c.id === id);
  }

  @computed
  get isLoaded() {
    return this.state.loadState === LoadState.Success;
  }

  @action loadDbServers(forceReload: boolean = false) {
    if ((this.isLoaded && !forceReload) || this.state.loadState === LoadState.Loading) {
      return;
    }

    this.state.loadState = LoadState.Loading;

    dbServers(this.root.cancelToken)
      .then(({ data }) => {
        const dbServers = _.sortBy(data, ['name']).map(
          (dbConnection) => new DbServer(dbConnection, this, this.root.cancelToken)
        );
        this.state.dbServers.replace(dbServers);
        this.state.loadState = LoadState.Success;
      })
      .catch(() => {
        console.log('Could not fetch db connections');
        this.state.loadState = LoadState.Error;
      });
  }

  @action reloadDbServer(dbServerId: string) {
    this.state.dbIndexLoadState = LoadState.Loading;
    databases(dbServerId, this.cancelToken)
      .then(({ data }) => {
        const dbIndex = data.map((db) => db.name);
        this.state.databaseIndex.set(dbServerId, dbIndex);
        this.state.dbIndexLoadState = LoadState.Success;
        return dbIndex;
      })
      .then((dbIndex) => {
        const dbMap = this.state.databases.get(dbServerId);
        if (!dbMap) {
          return;
        }
        dbMap.forEach((db, name) => {
          if (!dbIndex.includes(name)) {
            return this.state.databases.get(dbServerId)!.delete(name);
          }
          this.reloadDatabase(db.dbServerId, db.name);
        });
      })
      .catch((e) => {
        this.state.dbIndexLoadState = LoadState.Error;
      });
  }

  @computed
  get dbIndexLoadState() {
    return this.state.dbIndexLoadState;
  }

  @action
  loadDatabaseIndex(dbServerId: string, force: boolean = false) {
    if (this.state.databaseIndex.has(dbServerId) && !force) {
      return;
    }
    this.state.dbIndexLoadState = LoadState.Loading;
    databases(dbServerId, this.cancelToken)
      .then(({ data }) => {
        this.state.databaseIndex.set(
          dbServerId,
          data.map((db) => db.name)
        );
      })
      .then(() => {
        const initialDb = this.initialDb(dbServerId);
        if (!this.activeDatabaseName(dbServerId) && initialDb) {
          this.setActiveDatabase(dbServerId, initialDb);
        }
        this.state.dbIndexLoadState = LoadState.Success;
      })
      .catch((e) => {
        this.state.databaseIndex.delete(dbServerId);
        this.state.activeDbServerId = '';
        this.state.dbIndexLoadState = LoadState.Error;
      });
  }

  @action loadDatabase(dbServerId: string, dbName: string) {
    const dbServer = this.dbServer(dbServerId);
    if (!dbServer) {
      return;
    }

    database(dbServerId, dbName, this.cancelToken)
      .then(({ data }) => {
        const db = new Database(dbServer, data);
        this.state.databases.get(dbServerId)!.set(dbName, db);
        db.toggleShow();
        this.setActiveDatabase(dbServerId, dbName);
        this.setActiveDbServer(dbServerId);
        if (this.dbServer(dbServerId)?.initialTable) {
          const initTable = this.dbServer(dbServerId)!.initialTable;
          if (initTable) {
            initTable.toggleShow();
          }
        }
      })
      .catch((e) => {
        this.state.databases.delete(dbServerId);
        this.state.activeDatabase.delete(dbServerId);
      });
  }

  @action reloadDatabase(dbServerId: string, dbName: string) {
    const dbServer = this.dbServer(dbServerId);
    if (!dbServer) {
      return;
    }
    const oldDb = this.database(dbServerId, dbName);
    if (!oldDb) {
      return this.loadDatabase(dbServerId, dbName);
    }
    oldDb.isLoading = true;

    database(dbServerId, dbName, this.cancelToken)
      .then(({ data }) => {
        const db = new Database(dbServer, data);
        db.copyFrom(oldDb);
        this.state.databases.get(dbServerId)!.set(dbName, db);
      })
      .catch((e) => console.error('Update not successful: ', e));
  }

  loadedDatabases(dbServerId: string): Database[] {
    return Array.from(this.state.databases.get(dbServerId)?.values() ?? []);
  }

  loadedDatabaseMap(dbServerId: string): Map<string, Database> {
    return this.state.databases.get(dbServerId) ?? new Map();
  }

  queries(dbServerId: string): Query[] {
    const dbMap = this.loadedDatabaseMap(dbServerId);
    const queries = _.flatten(Array.from(dbMap, ([_, db]) => db.queries));

    // add placeholder query if the active database is loading
    const activeDbName = this.activeDatabaseName(dbServerId);
    if (activeDbName && !queries.find((q) => q.database.name === activeDbName)) {
      queries.push(PlaceholderQuery(activeDbName));
    }
    return queries;
  }

  database(dbServerId: string, dbName: string): Database | undefined {
    if (!this.state.databases.has(dbServerId)) {
      return;
    }
    return this.state.databases.get(dbServerId)!.get(dbName);
  }

  databaseNames(dbServerId: string): string[] {
    if (!this.state.databaseIndex.has(dbServerId)) {
      return [];
    }
    return this.state.databaseIndex.get(dbServerId) ?? [];
  }

  activeDatabaseName(dbServerId: string): string | undefined {
    return this.state.activeDatabase.get(dbServerId);
  }

  isDatabaseLoaded(dbServerId: string, dbName: string): boolean {
    return this.state.databases.get(dbServerId)?.has(dbName) ?? false;
  }

  activeDatabase(dbServerId: string): Database | undefined {
    return this.database(dbServerId, this.activeDatabaseName(dbServerId) ?? '');
  }

  @action
  setActiveDatabase(dbServerId: string, dbName: string) {
    if (!this.state.databases.has(dbServerId)) {
      this.state.databases.set(dbServerId, new Map<string, Database>());
    }
    this.state.activeDatabase.set(dbServerId, dbName);
  }

  initialDb(dbServerId: string): string | undefined {
    return this.dbServer(dbServerId)?.defaultDatabaseName;
  }

  @computed
  get activeDbServerId(): string {
    return this.state.activeDbServerId;
  }

  @computed
  get activeDbServer(): DbServer | undefined {
    if (!this.activeDbServerId) {
      return;
    }
    return this.dbServer(this.activeDbServerId);
  }

  setActiveDbServer(id: string) {
    this.state.activeDbServerId = id;
  }

  @action
  closeDbServer(dbServerId: string) {
    const dbServer = this.dbServer(dbServerId);
    if (!dbServer) {
      return;
    }
    const idx = this.loadedDbServers.indexOf(dbServer);

    this.state.databaseIndex.delete(dbServerId);
    this.state.databases.delete(dbServerId);

    const numQueries = this.loadedDbServers.length;
    if (numQueries > 0) {
      const nextDbServer = this.loadedDbServers[idx > 0 ? idx - 1 : 0];
      this.root.routing.push(nextDbServer.link);
    } else {
      this.root.routing.replace('/dashboard');
      this.setActiveDbServer('');
    }
  }

  get cancelToken() {
    return this.root.cancelToken;
  }

  @computed
  get dbServers() {
    return this.state.dbServers;
  }

  @computed
  get saveState() {
    return this.state.saveState;
  }

  @action updateDbServer(dbConnection: TempDbServer) {
    this.state.saveState = RequestState.Waiting;
    updateDbServer(dbConnection.params, this.root.cancelToken)
      .then(() => {
        const connection = this.state.dbServers.find((db) => db.id === dbConnection.id);
        if (!connection) return;
        this.state.dbServers.remove(connection);
        this.state.dbServers.push(new DbServer(dbConnection.props, this, this.root.cancelToken));
        this.state.saveState = RequestState.Success;
      })
      .catch(() => {
        this.state.saveState = RequestState.Error;
      });
  }

  @action createDbServer(dbConnection: TempDbServer) {
    this.state.saveState = RequestState.Waiting;
    createDbServer(dbConnection.tempDbPorps, this.root.cancelToken)
      .then(({ data }) => {
        this.state.dbServers.push(new DbServer(data, this, this.root.cancelToken));
        this.state.saveState = RequestState.Success;
      })
      .catch(() => {
        this.state.saveState = RequestState.Error;
      });
  }

  @action remove(dbServer: TempDbServer) {
    removeApi(dbServer.id, this.root.cancelToken)
      .then(() => {
        const connection = this.state.dbServers.find((con) => con.id === dbServer.id);
        if (!connection) {
          return;
        }
        this.state.dbServers.remove(connection);
      })
      .catch((e) => {
        console.log(e);
      });
  }

  @action cleanup() {
    this.state = new State();
  }

  @computed
  get tempDbServer(): TempDbServer | undefined {
    return this.state.tempDbServer;
  }

  @action
  setTempDbServer(tempDbServer?: TempDbServer) {
    this.state.tempDbServer = tempDbServer;
  }
}

export default DbServerStore;
