import { observable, computed, action, reaction } from 'mobx';
import { User as UserProps } from '../api/user';
import _ from 'lodash';
import {
  DatabaseSchemaQuery,
  ChangeableProps,
  UpdateProps,
  CreateProps,
  Changeable,
  DatabaseSchemaQueryStats
} from '../api/database_schema_query';
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
  readonly pristineState: ChangeableProps;
  readonly dbType: DbType;
  readonly isPersisted: boolean;
  readonly stats: DatabaseSchemaQueryStats;
  readonly orderPosition: number;

  @observable name: string;
  @observable description?: string;
  @observable isPrivate: boolean;
  @observable query: string;

  constructor(store: SchemaQueryStore, props: DatabaseSchemaQuery, orderPosition: number, persisted: boolean = true) {
    super();
    this.orderPosition = orderPosition;
    this.isPersisted = persisted;
    this.schemaQueryStore = store;
    this.id = props.id;
    this.name = props.name;
    this.description = props.description;
    this.isDefault = props.is_default;
    this.createdAt = new Date(props.created_at);
    this.updatedAt = new Date(props.updated_at);
    this.authorId = props.author_id;
    this.dbType = props.db_type;
    this.isPrivate = props.is_private;
    this.query = props.query;
    this.stats = props.stats;
    this.pristineState = {
      is_private: props.is_private,
      query: props.query,
      name: props.name,
      description: props.description
    };
  }

  @computed
  get isPublic(): boolean {
    return !this.isPrivate;
  }

  @computed
  get canEdit(): boolean {
    return this.schemaQueryStore.canEdit(this);
  }

  @action
  restore() {
    this.isPrivate = this.pristineState.is_private;
    this.query = this.pristineState.query;
    this.name = this.pristineState.name;
    this.description = this.pristineState.description;
  }

  @action
  save() {
    if (!this.isDirty) {
      return;
    }
    if (this.isPersisted) {
      this.schemaQueryStore.save(this);
    } else {
      this.schemaQueryStore.create(this);
    }
  }

  @action
  destroy() {
    if (this.isDefault) {
      return;
    }
    this.schemaQueryStore.destroy(this);
  }

  @action
  togglePrivacy() {
    this.isPrivate = !this.isPrivate;
  }

  @computed
  get changeablProps(): ChangeableProps {
    return {
      query: this.query,
      name: this.name,
      description: this.description,
      is_private: this.isPrivate
    };
  }

  @computed
  get updateProps(): UpdateProps {
    return {
      id: this.id,
      ...this.changeablProps
    };
  }

  @computed
  get createProps(): CreateProps {
    return {
      db_type: this.dbType,
      ...this.changeablProps
    };
  }

  @computed
  get isDirty(): boolean {
    if (!this.isPersisted) {
      return true;
    }
    return Object.values(Changeable).some((val) => {
      return this.changeablProps[val] !== this.pristineState[val];
    });
  }
}
