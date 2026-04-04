import { observable, computed, action } from 'mobx';
import _ from 'lodash';
import SqlQueryStore from '../stores/sql_query_store';
import DbServerStore from '../stores/db_server_store';
import UserStore from '../stores/user_store';
import { SqlQuery as SqlQueryProps, ChangeableProps, Changeable, update, SqlError } from '../api/sql_query';
import DbServer, { DbType } from './DbServer';
import { OwnerType } from '../api/db_server';
import Sql from './Sql';
import { DB_TYPE_MAPPING } from '../components/Workbench/QueryEditor/SqlEditor';
import Database from './Database';

const LINE_MATCHER = /.*\r?\n/gi;

export default class SqlQuery extends Sql {
  private readonly sqlQueryStore: SqlQueryStore;
  private readonly dbServerStore: DbServerStore;
  private readonly userStore: UserStore;
  readonly id: string;
  readonly userId: string;
  readonly dbServerId: string;
  readonly dbName: string;
  readonly query: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly isValid: boolean;
  readonly errors: SqlError[];
  readonly execTime?: number;
  @observable isPrivate: boolean;
  @observable isFavorite: boolean;
  readonly pristineState: ChangeableProps;

  constructor(
    queryStore: SqlQueryStore,
    dbServerStore: DbServerStore,
    userStore: UserStore,
    props: SqlQueryProps
  ) {
    super();
    this.sqlQueryStore = queryStore;
    this.dbServerStore = dbServerStore;
    this.userStore = userStore;

    this.id = props.id;
    this.userId = props.user_id;
    this.dbServerId = props.db_server_id;
    this.dbName = props.db_name;
    this.query = props.query;
    this.createdAt = new Date(props.created_at);
    this.updatedAt = new Date(props.updated_at);
    this.isValid = props.is_valid;
    this.execTime = props.exec_time;
    this.errors = props.error;

    this.isPrivate = props.is_private;
    this.isFavorite = props.is_favorite;
    this.pristineState = {
      is_private: props.is_private,
      is_favorite: props.is_favorite
    };
  }

  @computed
  get preview() {
    const len = this.query.length
    if (len < 3000) {
      return this.query
    }
    return `${this.query.slice(0, 2000)}\n...\n${this.query.slice(len-1000)}`
  }

  @computed
  get scope() {
    return `${this.dbServerId}-${this.dbName}`;
  }

  @action
  setAsActiveCard() {
    this.sqlQueryStore.setSelectedSqlQueryId(this.id);
  }

  @computed
  get isActive(): boolean {
    return this.sqlQueryStore.selectedSqlQuery?.id === this.id;
  }

  @computed
  get changeableProps(): ChangeableProps {
    return {
      is_private: this.isPrivate,
      is_favorite: this.isFavorite
    };
  }

  @computed
  get isDirty(): boolean {
    return Object.values(Changeable).some((val) => {
      return this.changeableProps[val] !== this.pristineState[val];
    });
  }

  @computed
  get dbServer(): DbServer | undefined {
    return this.dbServerStore.find(this.dbServerId);
  }

  @computed
  get database(): Database | undefined {
    return this.dbServer?.database(this.dbName);
  }

  @computed
  get dbServerName(): string | undefined {
    return this.dbServer?.name;
  }

  @computed
  get dbServerType(): DbType | undefined {
    return this.dbServer?.dbType;
  }

  @computed
  get databaseType() {
    return DB_TYPE_MAPPING[this.dbServerType ?? 'sql'];
  }

  @computed
  get dbServerOwnerType(): OwnerType | undefined {
    return this.dbServer?.ownerType;
  }

  @computed
  get ownerId(): string | undefined {
    return this.dbServer?.ownerId;
  }

  @computed
  get isOwner(): boolean {
    return this.userId === this.userStore.loggedInUser.id;
  }

  @action
  save() {
    this.sqlQueryStore.updateSqlQuery(this);
  }

  @action
  toggleIsPrivate() {
    this.isPrivate = !this.isPrivate;
    this.save();
  }

  @action
  toggleIsFavorite() {
    this.isFavorite = !this.isFavorite;
    this.save();
  }

  @action
  showInEditor() {
    if (this.database) {
      const query = this.database.addQuery();
      query.query = this.query;
      query.setActive();
    } else {
      this.dbServerStore.addOnDbLoadTask(this.dbServerId, this.dbName, (db: Database) => {
        const query = db.addQuery();
        query.query = this.query;
        query.setActive();
      });
    }
    this.dbServerStore.routeToDbServer(this.dbServerId, { dbName: this.dbName });
  }

  @action
  insertInEditor() {
    if (this.database && this.database.activeQuery) {
      const newContent = this.query;
      this.database.activeQuery.onSqlChange(newContent, this.database.activeQuery.lineCount);
    }
  }

  onSqlChange(_value: string, lineCount: number) {
    this.lineCount = lineCount;
  }
}
