import { observable, computed } from 'mobx';
import _ from 'lodash';
import { Group as GroupProps } from '../api/group';
import DbServerStore from '../stores/db_server_store';
import UserStore from '../stores/user_store';
import DbServer from './DbServer';
import { rejectUndefined } from '../utils/listFilters';
import User from './User';

export enum Mark {
  From = 'from',
  To = 'to',
  None = 'none'
}
export default class Group {
  private readonly dbServerStore: DbServerStore;
  private readonly userStore: UserStore;
  readonly id: string;
  readonly isPrivate: boolean;
  readonly createdAt: string;
  adminIds = observable(new Set<string>());
  outdatedUserIds = observable(new Set<string>());
  userIds = observable(new Set<string>());
  dbServerIds = observable(new Set<string>());
  @observable name: string;

  constructor(dbServerStore: DbServerStore, userStore: UserStore, props: GroupProps) {
    this.userStore = userStore;
    this.dbServerStore = dbServerStore;
    this.id = props.id;
    this.isPrivate = props.is_private;
    this.createdAt = props.created_at;
    this.userIds.replace(new Set(props.users.map((user) => user.id)));
    this.dbServerIds.replace(new Set(props.db_servers.map((dbServer) => dbServer.id)));
    this.adminIds.replace(new Set(props.admin_ids));
    this.outdatedUserIds.replace(new Set(props.outdated_user_ids));
    this.name = props.name;
  }

  @computed
  get members(): User[] {
    return rejectUndefined(
      Array.from(this.userIds).map((id) => this.userStore.users.find((u) => u.id === id))
    );
  }

  @computed
  get dbServers(): DbServer[] {
    return rejectUndefined(
      Array.from(this.dbServerIds).map((id) => this.dbServerStore.dbServers.find((u) => u.id === id))
    );
  }

  @computed
  get admins(): User[] {
    return rejectUndefined(
      Array.from(this.adminIds).map((id) => this.userStore.users.find((u) => u.id === id))
    );
  }

  @computed
  get isAdmin(): boolean {
    return this.adminIds.has(this.userStore.loggedInUser.id);
  }

  @computed
  get isMember(): boolean {
    return this.userIds.has(this.userStore.loggedInUser.id);
  }

  @computed
  get outdatedMembers(): User[] {
    return rejectUndefined(
      Array.from(this.outdatedUserIds).map((id) => this.userStore.users.find((u) => u.id === id))
    );
  }
}
