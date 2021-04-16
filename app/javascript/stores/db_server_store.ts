import { observable, action, reaction, computed, IReactionDisposer } from 'mobx';
import { RootStore, Store } from './root_store';
import _ from 'lodash';
import {
  dbServers,
  updateDbServer,
  createDbServer,
  remove as removeApi,
  databases,
  database,
  OwnerType,
  DbServer as DbServerProps,
  dbServer
} from '../api/db_server';
import DbServer, { DEFAULT_DB_SERVER } from '../models/DbServer';
import { TempDbServer, TempDbServerRole } from '../models/TempDbServer';
import 'regenerator-runtime/runtime';
import { ApiRequestState } from './session_store';
import Database from '../models/Database';
import Query, { PlaceholderQuery } from '../models/Query';
import { computedFn } from 'mobx-utils';

export enum LoadState {
  Loading,
  Error,
  Success,
  None
}

class State {
  dbServers = observable<DbServer>([]);
  @observable activeDbServerId: string = '';

  /**
   * mapping "db server id <-> db names"
   */
  databaseIndex = observable(new Map<string, string[]>());

  /**
   * mapping "db server id <-> active database"
   */
  activeDatabase = observable(new Map<string, string>());

  /**
   * mapping "db server id <-> 'db name <-> database id'"
   */
  databases = observable(new Map<string, Map<string, Database>>());

  /**
   * mapping "database id <-> onLoadFunctions(db)"
   *
   * when a database is loaded, all functions for a database will be called.
   * @see SqlQuery#showInEditor as an example, where a task to set the initial
   *  sql statement is defined.
   */
  onDatabaseLoaded = observable(new Map<string, ((db: Database) => void)[]>());

  databaseTreeViewFilter = observable(new Map<string, string>());

  @observable tempDbServer?: TempDbServer = undefined;

  @observable loadState: LoadState = LoadState.None;
  @observable dbIndexLoadState: LoadState = LoadState.None;
  @observable saveState: ApiRequestState = ApiRequestState.None;

  @observable queryState: ApiRequestState = ApiRequestState.None;
}

class DbServerStore implements Store {
  private readonly root: RootStore;
  @observable.ref
  private state = new State();

  loginDisposer: IReactionDisposer;
  dbIndexLoader?: IReactionDisposer;
  currentDbLoader?: IReactionDisposer;

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
    const initDisposer = reaction(
      () => this.root.session.initialized,
      () => {
    
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
                this.loadDatabase(activeDbServerId, dbName).then((db) => {
                  if (!db) {
                    return;
                  }
                  const tasks = this.state.onDatabaseLoaded.get(db.id)?.slice() ?? [];
                  this.state.onDatabaseLoaded.delete(db.id);
                  tasks.forEach((task) => task(db));
                });
              }
            }
          }
        );
        initDisposer();
      }
    )

    
  }

  componentWillUnmount() {
    this.loginDisposer();
    this.dbIndexLoader && this.dbIndexLoader();
    this.currentDbLoader && this.currentDbLoader();
  }

  databaseTreeViewFilter(dbServerId: string): string {
    if (!this.state.databaseTreeViewFilter.has(dbServerId)) {
      this.state.databaseTreeViewFilter.set(dbServerId, '');
    }
    return this.state.databaseTreeViewFilter.get(dbServerId)!;
  }

  @action
  addOnDbLoadTask(dbServerId: string, dbName: string, task: (db: Database) => void) {
    const id = `${dbServerId}-${dbName}`;
    if (!this.state.onDatabaseLoaded.has(id)) {
      this.state.onDatabaseLoaded.set(id, [task]);
    } else {
      this.state.onDatabaseLoaded.get(id)!.push(task);
    }
  }

  @action
  setDatabaseTreeViewFilter(dbServerId: string, filter: string) {
    this.state.databaseTreeViewFilter.set(dbServerId, filter);
  }

  @computed
  get loadedDbServers(): DbServer[] {
    return _.orderBy(
      Array.from(this.state.databaseIndex.keys()).map((id) => this.find(id)!),
      'name',
      'asc'
    );
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
        this.addDbServers(data);
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
    const dbServer = this.find(dbServerId)
    if (dbServer) {
      dbServer.connectionError = undefined;
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
      .catch((e: Error) => {
        const dbServer = this.find(dbServerId)
        if (dbServer) {
          dbServer.connectionError = e.message;
        }
        this.state.databaseIndex.delete(dbServerId);
        this.state.activeDbServerId = '';
        this.state.dbIndexLoadState = LoadState.Error;
      });
  }

  @action loadDatabase(dbServerId: string, dbName: string): Promise<Database | undefined> {
    const dbServer = this.find(dbServerId);
    if (!dbServer) {
      return new Promise((resolve) => resolve(undefined));
    }
    const placeholderDb = new Database(dbServer, { db_server_id: dbServerId, name: dbName, schemas: [] });
    placeholderDb.isLoading = true;
    this.state.databases.get(dbServerId)?.set(dbName, placeholderDb);

    return database(dbServerId, dbName, this.cancelToken)
      .then(({ data }) => {
        const db = new Database(dbServer, data);
        this.state.databases.get(dbServerId)!.set(dbName, db);
        db.toggleShow();
        this.setActiveDatabase(dbServerId, dbName);
        this.setActiveDbServer(dbServerId);
        if (this.find(dbServerId)?.initialTable) {
          const initTable = this.find(dbServerId)!.initialTable;
          if (initTable) {
            initTable.toggleShow();
          }
        }
        return db;
      })
      .catch((err) => {
        placeholderDb.isLoading = false;
        placeholderDb.loadError = err.message;
        return new Promise((resolve) => resolve(undefined));
      });
  }

  @action reloadDatabase(dbServerId: string, dbName: string) {
    const dbServer = this.find(dbServerId);
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

  isOutdated(dbServerId: string): boolean {
    const dbServer = this.find(dbServerId);
    if (!dbServer) {
      return true;
    }

    if (dbServer.ownerType === OwnerType.Group) {
      const group = this.root.groupStore.find(dbServer.ownerId);
      if (group) {
        return group.isOutdated;
      }
    }
    return false;
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
    return this.find(dbServerId)?.defaultDatabaseName;
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
    return this.find(this.activeDbServerId);
  }

  @action
  routeToDbServer(id: string, options?: { dbName?: string, replace?: boolean }) {
    if (options?.replace) {      
      if (options.dbName) {
        this.root.routing.replace(`/connections/${id}/${options.dbName}`);
      } else {
        this.root.routing.replace(`/connections/${id}`);
      }
    } else {
      if (options?.dbName) {
        this.root.routing.push(`/connections/${id}/${options.dbName}`);
      } else {
        this.root.routing.push(`/connections/${id}`);
      }
    }
  }

  setActiveDbServer(id: string) {
    this.state.activeDbServerId = id;
  }

  @action
  closeDbServer(dbServerId: string) {
    const dbServer = this.find(dbServerId);
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

  @computed
  get userDbServers() {
    return this.dbServers.filter((dbServer) => dbServer.ownerType === OwnerType.User);
  }

  @computed
  get groupDbServers() {
    return this.dbServers.filter((dbServer) => dbServer.ownerType === OwnerType.Group);
  }

  @action updateDbServer(dbConnection: DbServer): Promise<void> {
    this.state.saveState = ApiRequestState.Waiting;
    return updateDbServer(dbConnection.params, this.root.cancelToken)
      .then(() => {
        const connection = this.state.dbServers.find((db) => db.id === dbConnection.id);
        if (!connection) {
          return;
        }
        this.state.dbServers.remove(connection);
        this.state.dbServers.push(
          new DbServer(dbConnection.props, this, this.root.schemaQueryStore, this.root.cancelToken)
        );
        this.state.saveState = ApiRequestState.Success;
      })
      .catch(() => {
        this.state.saveState = ApiRequestState.Error;
      });
  }

  @action createDbServer(dbConnection: TempDbServer) {
    this.state.saveState = ApiRequestState.Waiting;
    createDbServer(dbConnection.tempDbPorps, this.root.cancelToken)
      .then(({ data }) => {
        this.state.dbServers.push(
          new DbServer(data, this, this.root.schemaQueryStore, this.root.cancelToken)
        );
        if (data.owner_type === OwnerType.Group) {
          const group = this.root.groupStore.joinedGroups.find((group) => group.id === data.owner_id);
          if (group) {
            group.dbServerIds.push(data.id);
          }
        }
        this.state.saveState = ApiRequestState.Success;
      })
      .catch(() => {
        this.state.saveState = ApiRequestState.Error;
      });
  }

  @action remove(dbServer: TempDbServer) {
    removeApi(dbServer.id, this.root.cancelToken)
      .then(() => {
        const connection = this.state.dbServers.find((con) => con.id === dbServer.id);
        if (!connection) {
          return;
        }
        if (connection.ownerType === OwnerType.Group) {
          const group = this.root.groupStore.joinedGroups.find((group) => group.id === connection.id);
          if (group) {
            group.dbServerIds.remove(connection.id);
          }
        }
        this.state.dbServers.remove(connection);
      })
      .catch((e) => {
        console.log(e);
      });
  }

  find = computedFn(
    function (this: DbServerStore, id?: string): DbServer | undefined {
      if (!id) {
        return;
      }
      return this.state.dbServers.find((dbServer) => dbServer.id === id);
    },
    { keepAlive: true }
  );

  @action
  findOrLoad(id: string): DbServer | undefined {
    const server = this.find(id);
    if (server) {
      return server;
    }
    dbServer(id, this.cancelToken).then(({ data }) => {
      this.addDbServers([data]);
    });
  }

  @action
  addDbServers(dbServerProps: DbServerProps[]) {
    dbServerProps.forEach((dbServer) => {
      const oldDbServer = this.find(dbServer.id);
      if (oldDbServer) {
        this.state.dbServers.remove(oldDbServer);
      }
    });
    dbServerProps.forEach;
    const dbServers = dbServerProps.map(
      (dbConnection) => new DbServer(dbConnection, this, this.root.schemaQueryStore, this.root.cancelToken)
    );
    this.state.dbServers.push(...dbServers);
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
    if (tempDbServer) {
      this.root.schemaQueryStore.setSelectedDbType(tempDbServer.dbType);
    }
  }

  @action
  editDbServer(dbServerId: string) {
    const dbServer = this.find(dbServerId);
    const temp = new TempDbServer(
      dbServer?.props ?? { ...DEFAULT_DB_SERVER, owner_type: OwnerType.User, owner_id: this.root.session.currentUser.id },
      this.root.dbServer,
      this.root.schemaQueryStore,
      dbServer ? TempDbServerRole.Update : TempDbServerRole.Create,
      this.cancelToken
    );
    this.setTempDbServer(temp);
    if (!this.root.routing.location.pathname.startsWith('/dashboard')) {
      this.root.routing.push('/dashboard');
    }
  }
}

export default DbServerStore;
