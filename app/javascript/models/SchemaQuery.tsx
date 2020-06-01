import { observable, computed, action } from 'mobx';
import { User as UserProps } from '../api/user';
import _ from 'lodash';
import { DatabaseSchemaQuery } from '../api/database_schema_query';
import { DbType } from './DbServer';
import SchemaQueryStore from '../stores/schema_query_store';
import Sql from './Sql';

export default class SchemaQuery extends Sql {
  private readonly schemaQueryStore: SchemaQueryStore;
  readonly id: string;
  readonly isDefault: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly authorId: string;
  readonly previousRevisionId: string;
  readonly position?: number;
  readonly nextRevisionIds?: string[];
  @observable dbType: DbType;
  @observable isPrivate: boolean;
  @observable query: string;
  constructor(store: SchemaQueryStore, props: DatabaseSchemaQuery) {
    super();
    this.schemaQueryStore = store;
    this.id = props.id;
    this.isDefault = props.is_default;
    this.createdAt = new Date(props.created_at);
    this.updatedAt = new Date(props.updated_at);
    this.authorId = props.author_id;
    this.previousRevisionId = props.previous_revision_id;
    this.position = props.position;
    this.nextRevisionIds = props.next_revision_ids;
    this.dbType = props.db_type;
    this.isPrivate = props.is_private;
    this.query = props.query;
  }
}
