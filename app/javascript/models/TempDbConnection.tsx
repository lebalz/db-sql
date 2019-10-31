import { computed, action, reaction, observable } from 'mobx';
import { DbConnection as DbConnectionProps, dbConnectionPassword } from '../api/db_connection';
import { DbConnection as TempDbConnectionProps, databases, test, tables } from '../api/temp_db_connection';
import _ from 'lodash';
import DbConnection from './DbConnection';
import Database from './Database';
import DbTable from './DbTable';
import { RequestState } from '../stores/session_store';

export enum TempDbConnectionRole {
  Update, Create
}

export class TempDbConnection extends DbConnection {
  readonly role: TempDbConnectionRole;
  @observable testConnectionState: RequestState = RequestState.None;
  @observable message?: String = undefined;
  @observable validConnection?: boolean = false;
  @observable tablesLoaded?: boolean = false;

  tables = observable<DbTable>([]);
  constructor(props: DbConnectionProps, role: TempDbConnectionRole) {
    super(props);
    this.role = role;
    this.testConnection = _.debounce(
      this.testConnection,
      400,
      { leading: false }
    );

    reaction(
      () => (this.dbConnectionHash),
      (hash) => {
        this.testConnection();
      }
    );
    reaction(
      () => (this.validConnection),
      (valid) => {
        if (!valid) return;
        this.loadDatabases();
      }
    );
    reaction(
      () => (this.isLoaded),
      (isLoaded) => {
        if (!isLoaded) {
          this.tablesLoaded = false;
          return;
        }

        this.loadTables();
      }
    );
    reaction(
      () => (this.initialDb),
      (initialDb) => {
        this.loadTables();
      }
    );
    this.loadPassword();
  }

  @action loadPassword() {
    if (this.role === TempDbConnectionRole.Create) {
      this.password = '';
      return;
    }
    dbConnectionPassword(this.id).then(
      ({ data }) => {
        this.password = data.password;
      }
    );
  }

  @computed get tempDbPorps(): TempDbConnectionProps {
    return {
      name: this.name,
      db_type: this.dbType,
      host: this.host,
      port: this.port,
      username: this.username,
      initial_db: this.isLoaded ? this.initialDb : undefined,
      initial_table: this.tablesLoaded ? this.initialTable : undefined,
      password: this.password || ''
    };
  }

  /**
   * @return [Boolean] wheter needed props to connect to a db are present
   */
  @computed get dbConnectionHash() {
    return [this.dbType, this.host, this.port, this.username, this.password].join(';');
  }

  @action loadDatabases() {
    this.isLoaded = undefined;
    databases(this.tempDbPorps).then(
      ({ data }) => {
        this.databases.replace(data.map(db => new Database(this, db)));
        this.isLoaded = true;
      }
    ).catch((e) => {
      this.databases.replace([]);
      this.isLoaded = false;
    });
  }

  @action loadTables() {
    const db = this.databases.find(db => db.name === this.initialDb);
    if (!db) {
      this.tablesLoaded = false;
      this.initialTable = undefined;
      return;
    }

    this.tablesLoaded = undefined;
    tables(this.tempDbPorps, db.name).then(
      ({ data }) => {
        this.tablesLoaded = true;
        this.tables.replace(data.map(table => new DbTable(db, table)));
        const table = this.tables.find(table => table.name === this.initialTable);
        if (!table) {
          this.initialTable = undefined;
        }
      }
    ).catch((e) => {
      this.tablesLoaded = false;
      this.initialTable = undefined;
      this.tables.replace([]);
    });
  }

  @action.bound testConnection() {
    this.testConnectionState = RequestState.Waiting;
    this.validConnection = undefined;
    test(this.tempDbPorps).then(({ data }) => {
      this.validConnection = data.success;
      this.message = data.success
        ? 'Connection established'
        : data.message;
      this.testConnectionState = RequestState.Success;
    }).catch((e) => {
      this.validConnection = false;
      this.message = e.message;
      this.testConnectionState = RequestState.Error;
    });
  }
}
