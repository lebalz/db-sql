import { observable, action, computed, reaction } from 'mobx';
import { computedFn } from 'mobx-utils';
import { RootStore, Store } from './root_store';
import _ from 'lodash';
import 'regenerator-runtime/runtime';
import Database from '../models/Database';
import { databases, database } from '../api/db_server';

interface DatabaseIndex {
  names: string[];
  activeDatabase?: string;
}

class State {
  databaseIndex = observable(new Map<string, DatabaseIndex>());
  databases = observable(new Map<string, Map<string, Database>>());
}

class DatabaseStore implements Store {
  private readonly root: RootStore;
  @observable.ref
  private state = new State();

  constructor(root: RootStore) {
    this.root = root;

    // load the database index if it is not loaded
    reaction(
      () => this.root.dbServer.activeDbServerId,
      (activeDbServerId) => {
        if (activeDbServerId) {
          this.loadIndex(activeDbServerId);
        }
      }
    );

    // load the current database if it is not loaded
    reaction(
      () => this.activeDatabaseName,
      (activeDatabaseName) => {
        if (activeDatabaseName) {
          if (!this.activeDatabase) {
            const { activeDbServerId } = this.root.dbServer;
            this.loadDatabase(activeDbServerId, activeDatabaseName);
          }
        }
      }
    );
  }

  @computed
  get cancelToken() {
    return this.root.cancelToken;
  }

  @action
  loadIndex(dbServerId: string, force: boolean = false) {
    if (this.state.databaseIndex.has(dbServerId) && !force) {
      return;
    }
    databases(dbServerId, this.cancelToken)
      .then(({ data }) => {
        this.state.databaseIndex.set(dbServerId, { names: data.map((db) => db.name) });
        this.state.databases.set(dbServerId, new Map<string, Database>());
      })
      .then(() => {
        const dbIndex = this.state.databaseIndex.get(dbServerId)!;
        const initialDb = this.initialDb(dbServerId);
        const initDb = dbIndex.names.find((name) => name === initialDb);
        dbIndex.activeDatabase = initDb || dbIndex.names[0];
      })
      .catch((e) => {
        this.state.databaseIndex.set(dbServerId, { names: [] });
      });
  }

  @action loadDatabase(dbServerId: string, dbName: string) {
    database(dbServerId, dbName, this.cancelToken).then(({ data }) => {
      const db = new Database(this, data);
      this.state.databases.get(dbServerId)!.set(dbName, db);
      db.toggleShow();
      this.state.databaseIndex.get(dbServerId)!.activeDatabase = dbName;
      this.root.dbServer.setActiveDbServer(dbServerId);
    });
  }

  loadedDatabases(dbServerId: string): Database[] {
    return Array.from(this.state.databases.get(dbServerId)?.values() ?? []);
  }

  loadedDatabaseMap(dbServerId: string): Map<string, Database> {
    return this.state.databases.get(dbServerId) ?? new Map();
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
    return this.state.databaseIndex.get(dbServerId)!.names;
  }

  @computed
  get dbServerIdsWithLoadedDatabases(): string[] {
    return Array.from(this.state.databases.keys());
  }

  @computed
  get activeDatabaseName(): string | undefined {
    return this.state.databaseIndex.get(this.root.dbServer.activeDbServerId)
      ?.activeDatabase;
  }

  isLoadedDatabase(dbServerId: string, dbName: string): boolean {
    return this.state.databases.get(dbServerId)?.has(dbName) ?? false;
  }

  @computed
  get activeDatabase(): Database | undefined {
    const activeDatabase = this.activeDatabaseName;
    if (!activeDatabase) {
      return;
    }

    const { activeDbServerId } = this.root.dbServer;
    return this.state.databases.get(activeDbServerId)?.get(activeDatabase);
  }

  @action
  setActiveDatabase(dbServerId: string, dbName: string) {
    const dbIndex = this.state.databaseIndex.get(dbServerId);
    if (!dbIndex) {
      return;
    }

    dbIndex.activeDatabase = dbName;
  }

  initialDb(dbServerId: string) {
    return this.root.dbServer.findDbServer(dbServerId)?.initialDb;
  }

  cleanup() {
    this.state.databaseIndex.clear();
  }
}

export default DatabaseStore;
