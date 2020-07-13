import { observable, computed, action } from 'mobx';
import _ from 'lodash';
import SqlQueryStore from '../stores/sql_query_store';
import DbServerStore from '../stores/db_server_store';
import UserStore from '../stores/user_store';
import { SqlQuery as SqlQueryProps, ChangeableProps } from '../api/sql_query';
export default class SqlQuery {
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
  @observable description: string;
  @observable is_private: boolean;
  readonly pristineState: ChangeableProps;

  constructor(
    queryStore: SqlQueryStore,
    dbServerStore: DbServerStore,
    userStore: UserStore,
    props: SqlQueryProps
  ) {
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

    this.description = props.description ?? '';
    this.is_private = props.is_private;
    this.pristineState = {
      is_private: props.is_private,
      description: props.description ?? ''
    };
  }
}
