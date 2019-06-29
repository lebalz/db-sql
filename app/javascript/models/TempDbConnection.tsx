import { computed, action, reaction, observable } from 'mobx';
import { DbConnection as DbConnectionProps, dbConnectionPassword } from '../api/db_connection';
import { DbConnection as TempDbConnectionProps, databases, test, tables } from '../api/temp_db_connection';
import _ from 'lodash';
import DbConnection, { QueryState } from './DbConnection';
import Database from './Database';
import DbTable from './DbTable';

export enum TempDbConnectionRole {
  Update, Create
}

export class TempDbConnection extends DbConnection {
  readonly role: TempDbConnectionRole;
  tables = observable<DbTable>([]);
  constructor(props: DbConnectionProps, role: TempDbConnectionRole) {
    super(props);
    this.role = role;
    this.loadDatabases = _.debounce(
      this.loadDatabases,
      1000,
      { leading: false }
    );
    this.loadPassword();

    reaction(
      () => (this.dbConnectionHash),
      (hash) => {
        Promise.all([
          this.loadDatabases()
        ]).then(() => {
          if (this.databases.length > 0 && !this.databases.find(db => db.name === this.initialDb)) {
            this.initialDb = undefined;
            this.initialSchema = undefined;
          }
        });
      }
    );
    reaction(
      () => (this.initialDb),
      (initDb) => {
        if (initDb && initDb.length > 0) {
          Promise.all([
            this.loadTables()
          ]).then(() => {
            if (!this.tables.find(table => table.name === this.initialSchema)) {
              this.initialSchema = undefined;
            }
          });
        } else {
          this.initialSchema = undefined;
        }
      }
    );
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
      initial_db: this.initialDb,
      initial_schema: this.initialSchema,
      password: this.password || ''
    };
  }

  /**
   * @return [Boolean] wheter needed props to connect to a db are present
   */
  @computed get dbConnectionHash() {
    return [this.dbType, this.host, this.port, this.username, this.password].join(';');
  }

  @action.bound loadDatabases() {
    this.queryState = QueryState.Executing;
    databases(this.tempDbPorps).then(
      ({ data }) => {
        this.databases.replace(data.map(db => new Database(this, db)));
        this.valid = true;
        this.queryState = QueryState.Success;
      }
    ).catch((e) => {
      this.databases.replace([]);
      this.queryState = QueryState.Error;
      this.valid = false;
    });
  }

  @action loadTables() {
    const db = this.databases.find(db => db.name === this.initialDb);
    if (!db) return;

    tables(this.tempDbPorps, db.name).then(
      ({ data }) => {
        this.tables.replace(data.map(table => new DbTable(db, table)));
      }
    ).catch((e) => {
      this.tables.replace([]);
    });
  }

  @action testConnection() {
    test(this.tempDbPorps).then(({ data }) => {
      console.log(data);
      this.valid = data.success;
    });
  }
}
