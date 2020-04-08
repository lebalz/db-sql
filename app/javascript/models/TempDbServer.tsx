import { computed, action, reaction, observable } from 'mobx';
import { DbServer as DbServerProps, dbServerPassword } from '../api/db_server';
import {
  DbServer as TempDbConnectionProps,
  databases,
  test,
  tables,
  DatabaseName,
  DbTableName
} from '../api/temp_db_server';
import _ from 'lodash';
import DbServer from './DbServer';
import { RequestState } from '../stores/session_store';
import { REST } from '../declarations/REST';
import { CancelTokenSource } from 'axios';
import DbServerStore from '../stores/db_server_store';

export enum TempDbServerRole {
  Update,
  Create
}

export class TempDbServer extends DbServer {
  readonly role: TempDbServerRole;
  @observable testConnectionState: RequestState = RequestState.None;
  @observable message?: String = undefined;
  @observable validConnection?: boolean = false;
  @observable tablesLoaded?: boolean = false;
  @observable isLoaded: boolean = false;
  @observable tableRequestState: REST = REST.None;

  databases = observable<DatabaseName>([]);
  tables = observable<DbTableName>([]);

  constructor(
    props: DbServerProps,
    dbServerStore: DbServerStore,
    role: TempDbServerRole,
    cancelToken: CancelTokenSource
  ) {
    super(props, dbServerStore, cancelToken);
    this.role = role;
    this.testConnection = _.debounce(this.testConnection, 400, { leading: false });

    reaction(
      () => this.dbConnectionHash,
      (hash) => {
        this.testConnection();
      }
    );
    reaction(
      () => this.validConnection,
      (valid) => {
        if (!valid) {
          return;
        }
        this.loadDatabases();
      }
    );
    reaction(
      () => this.dbRequestState,
      (requestState) => {
        if (requestState !== REST.Success) {
          this.tableRequestState = REST.None;
          return;
        }

        this.loadTables();
      }
    );
    reaction(
      () => this.initDb,
      (initialDb) => {
        this.loadTables();
      }
    );
    this.loadPassword();
  }

  @action loadPassword() {
    if (this.role === TempDbServerRole.Create) {
      this.password = '';
      return;
    }
    dbServerPassword(this.id, this.cancelToken).then(({ data }) => {
      this.password = data.password;
    });
  }

  @computed get tempDbPorps(): TempDbConnectionProps {
    return {
      name: this.name,
      db_type: this.dbType,
      host: this.host,
      port: this.port,
      username: this.username,
      initial_db: this.isLoaded ? this.initDb : undefined,
      initial_table: this.tablesLoaded ? this.initTable : undefined,
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
    this.dbRequestState = REST.Requested;
    databases(this.tempDbPorps, this.cancelToken)
      .then(({ data }) => {
        this.databases.replace(data);
        this.dbRequestState = REST.Success;
      })
      .catch((e) => {
        this.databases.replace([]);
        this.dbRequestState = REST.Error;
      });
  }

  @action loadTables() {
    const db = this.databases.find((db) => db.name === this.initDb);
    if (!db) {
      this.tablesLoaded = false;
      this.initTable = undefined;
      return;
    }

    this.tablesLoaded = undefined;
    this.tableRequestState = REST.Requested;
    tables(this.tempDbPorps, db.name, this.cancelToken)
      .then(({ data }) => {
        this.tablesLoaded = true;
        this.tables.replace(data);
        const table = this.tables.find((table) => table.name === this.initTable);
        this.tableRequestState = REST.Success;
        if (!table) {
          this.initTable = undefined;
        }
      })
      .catch((e) => {
        this.tablesLoaded = false;
        this.initTable = undefined;
        this.tables.replace([]);
        this.tableRequestState = REST.Error;
      });
  }

  @action.bound testConnection() {
    this.testConnectionState = RequestState.Waiting;
    this.validConnection = undefined;
    test(this.tempDbPorps, this.cancelToken)
      .then(({ data }) => {
        this.validConnection = data.success;
        this.message = data.success ? 'Connection established' : data.message;
        this.testConnectionState = RequestState.Success;
      })
      .catch((e) => {
        this.validConnection = false;
        this.message = e.message;
        this.testConnectionState = RequestState.Error;
      });
  }
}
