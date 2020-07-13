import { observable, computed, action } from 'mobx';
import _ from 'lodash';
import SqlQueryStore from '../stores/sql_query_store';
import DbServerStore from '../stores/db_server_store';
import UserStore from '../stores/user_store';
import { SqlQuery as SqlQueryProps, ChangeableProps, Changeable } from '../api/sql_query';
import DbServer, { DbType } from './DbServer';
import { OwnerType } from '../api/db_server';
import Sql from './Sql';
import { DB_TYPE_MAPPING } from '../components/DatabaseServer/Query/SqlEditor';
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
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly isValid: boolean;
  @observable description: string;
  @observable isPrivate: boolean;
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
    this.createdAt = props.created_at;
    this.updatedAt = props.updated_at;
    this.isValid = props.is_valid;

    this.description = props.description ?? '';
    this.isPrivate = props.is_private;
    this.pristineState = {
      is_private: props.is_private,
      description: props.description ?? ''
    };
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
  get changeablProps(): ChangeableProps {
    return {
      description: this.description,
      is_private: this.isPrivate
    };
  }

  @computed
  get isDirty(): boolean {
    return Object.values(Changeable).some((val) => {
      return this.changeablProps[val] !== this.pristineState[val];
    });
  }

  @computed
  get dbServer(): DbServer | undefined {
    return this.dbServerStore.find(this.dbServerId);
  }

  @computed
  get database(): Database | undefined {
    return this.dbServer?.database(this.dbName)
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
  get dbServerOwnerType(): string | undefined {
    return this.dbServer?.ownerType;
  }

  // @computed
  // get lineCount(): number {
  //   return this.query.match(LINE_MATCHER)?.length ?? 0;
  // }

  onSqlChange(_value: string, lineCount: number) {
    this.lineCount = lineCount;
  }
}
