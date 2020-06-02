import { observable, computed, action, reaction } from 'mobx';
import { User as UserProps } from '../api/user';
import _ from 'lodash';
import { DatabaseSchemaQuery, NewRevision } from '../api/database_schema_query';
import { DbType } from './DbServer';
import SchemaQueryStore from '../stores/schema_query_store';
import Sql from './Sql';
import { rejectUndefined } from '../utils/listFilters';

export default class SchemaQuery extends Sql {
  private readonly schemaQueryStore: SchemaQueryStore;
  readonly id: string;
  readonly isDefault: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly authorId: string;
  readonly previousRevisionId?: string;
  readonly position?: number;
  readonly nextRevisionIds: string[];
  readonly pristineState: NewRevision;
  readonly dbType: DbType;
  @observable revisionsLoaded: boolean;
  @observable isLatest: boolean;
  @observable isPrivate: boolean;
  @observable query: string;
  @observable nextRevisionBranchId?: string;
  constructor(store: SchemaQueryStore, props: DatabaseSchemaQuery, revisionsLoaded: boolean = false) {
    super();
    this.schemaQueryStore = store;
    this.id = props.id;
    this.isDefault = props.is_default;
    this.createdAt = new Date(props.created_at);
    this.updatedAt = new Date(props.updated_at);
    this.authorId = props.author_id;
    this.previousRevisionId = props.previous_revision_id;
    this.nextRevisionIds = props.next_revision_ids;
    this.nextRevisionBranchId = props.next_revision_ids[0];
    this.dbType = props.db_type;
    this.isPrivate = props.is_private;
    this.query = props.query;
    this.isLatest = props.is_latest;
    this.pristineState = {
      is_private: props.is_private,
      query: props.query
    };
    this.revisionsLoaded = revisionsLoaded || this.previousRevisionId == undefined;
  }

  @action
  save() {
    if (!this.isDirty) {
      return;
    }
    this.schemaQueryStore.save(this);
  }

  @action
  loadRevisions(force: boolean = false): Promise<boolean> {
    if (!force && this.revisionsLoaded) {
      return Promise.resolve(true);
    }
    return this.schemaQueryStore.loadRevisions(this.id);
  }

  @action
  destroy() {
    if (this.isDefault) {
      return;
    }
    this.schemaQueryStore.destroy(this);
  }

  @computed
  get previousRevision(): SchemaQuery | undefined {
    return this.schemaQueryStore.find(this.previousRevisionId);
  }

  @computed
  get nextRevision(): SchemaQuery | undefined {
    if (!this.nextRevisionBranchId) {
      return this.nextRevisions[0];
    }
    return this.schemaQueryStore.find(this.nextRevisionBranchId);
  }

  @computed
  get latestRevision(): SchemaQuery {
    if (this.isLatest) {
      return this;
    }
    return this.nextRevision?.latestRevision ?? this;
  }

  @computed
  get nextRevisions(): SchemaQuery[] {
    return rejectUndefined(
      this.nextRevisionIds.map((id) => {
        return this.schemaQueryStore.find(id);
      })
    );
  }

  @computed
  get branchPosition(): number {
    if (!this.nextRevisionBranchId) {
      return 0;
    }
    return this.nextRevisionIds.indexOf(this.nextRevisionBranchId);
  }

  @action
  updateRevisionBranch(parent?: SchemaQuery) {
    if (parent) {
      this.nextRevisionBranchId = parent.id;
    }
    this.previousRevision?.updateRevisionBranch(this);
  }

  @action
  rotateToNextRevisionBranch(direction: 'forward' | 'backward') {
    if (!this.nextRevisionBranchId) {
      this.nextRevisionBranchId = this.nextRevisionIds[0];
    } else {
      const idx = this.nextRevisionIds.indexOf(this.nextRevisionBranchId);
      if (direction === 'forward') {
        this.nextRevisionBranchId = this.nextRevisionIds[(idx + 1) % this.nextRevisionIds.length];
      } else {
        if (idx === 0) {
          this.nextRevisionBranchId = this.nextRevisionIds[this.nextRevisionIds.length - 1];
        } else {
          this.nextRevisionBranchId = this.nextRevisionIds[(idx - 1) % this.nextRevisionIds.length];
        }
      }
    }
  }

  @computed
  get previousRevisions(): SchemaQuery[] {
    if (!this.previousRevision) {
      return [];
    }
    return [...this.previousRevision.previousRevisions, this.previousRevision];
  }

  @computed
  get futureRevisions(): SchemaQuery[] {
    if (!this.nextRevision) {
      return [];
    }
    return [this.nextRevision, ...this.nextRevision.futureRevisions];
  }

  @computed
  get revisions(): SchemaQuery[] {
    return [...this.previousRevisions, this, ...this.futureRevisions];
  }

  @computed
  get revisionNumber(): number {
    return this.previousRevisions.length + 1;
  }

  @computed
  get revisionProps(): NewRevision {
    return {
      is_private: this.isPrivate,
      query: this.query
    };
  }

  @computed
  get isDirty() {
    return this.pristineState.is_private !== this.isPrivate || this.pristineState.query !== this.query;
  }
}
