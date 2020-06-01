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
import { ApiRequestState } from '../stores/session_store';
import { REST } from '../declarations/REST';
import { CancelTokenSource } from 'axios';
import DbServerStore from '../stores/db_server_store';
import SchemaQueryStore from '../stores/schema_query_store';

export enum TempDbServerRole {
  Update,
  Create
}

export class TempDbServer extends DbServer {
  readonly role: TempDbServerRole;
  @observable testConnectionState: ApiRequestState = ApiRequestState.None;
  @observable message?: String = undefined;
  @observable validConnection?: boolean = false;
  @observable tablesLoaded?: boolean = false;
  @observable isLoaded: boolean = false;
  @observable tableRequestState: REST = REST.None;

  databases = observable<DatabaseName>([]);
  tables = observable<DbTableName>([]);
  testConnection = _.debounce(this.testCurrentConnection, 2500, { leading: true, trailing: true });

  constructor(
    props: DbServerProps,
    dbServerStore: DbServerStore,
    schemaQueryStore: SchemaQueryStore,
    role: TempDbServerRole,
    cancelToken: CancelTokenSource
  ) {
    super(props, dbServerStore, schemaQueryStore, cancelToken);
    this.role = role;

    reaction(
      () => this.dbConnectionHash,
      (hash) => {
        this.testConnection();
      }
    );
    reaction(
      () => this.dbType,
      (type) => {
        this.databaseSchemaQueryId = schemaQueryStore.default(type).id;
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

  @action
  loadPassword() {
    if (this.role === TempDbServerRole.Create) {
      this.password = '';
      return;
    }
    dbServerPassword(this.id, this.cancelToken).then(({ data }) => {
      this.password = data.password;
    });
  }

  @computed
  get initialDatabase(): string | undefined {
    return this.initDb ? this.initDb : undefined;
  }

  @computed
  get validDatabaseProps(): boolean {
    return [this.dbType, this.host, this.port, this.username].every((prop) => `${prop}` !== '');
  }

  @computed
  get tempDbPorps(): TempDbConnectionProps {
    return {
      name: this.name,
      db_type: this.dbType,
      host: this.host,
      port: this.port,
      username: this.username,
      initial_db: this.initialDatabase,
      initial_table: this.tablesLoaded ? this.initTable : undefined,
      password: this.password || '',
      database_schema_query_id: this.databaseSchemaQueryId
    };
  }

  /**
   * @return [Boolean] wheter needed props to connect to a db are present
   */
  @computed
  get dbConnectionHash() {
    return [this.dbType, this.host, this.port, this.username, this.password].join(';');
  }

  @action
  loadDatabases() {
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

  @action
  loadTables() {
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

  @action.bound
  private testCurrentConnection() {
    if (!this.validDatabaseProps) {
      return;
    }
    this.testConnectionState = ApiRequestState.Waiting;
    this.validConnection = undefined;
    test(this.tempDbPorps, this.cancelToken)
      .then(({ data }) => {
        this.validConnection = data.success;
        this.message = data.success ? 'Connection established' : data.message;
        this.testConnectionState = ApiRequestState.Success;
      })
      .catch((e) => {
        this.validConnection = false;
        this.message = e.message;
        this.testConnectionState = ApiRequestState.Error;
      });
  }
}
