import { observable, computed, action } from 'mobx';
import _ from 'lodash';
import { Group as GroupProps } from '../api/group';
import DbServerStore from '../stores/db_server_store';
import UserStore from '../stores/user_store';
import DbServer from './DbServer';
import { rejectUndefined } from '../utils/listFilters';
import User from './User';
import GroupStore from '../stores/group_store';
import GroupMember from './GroupMember';
import { GroupUser } from '../api/user';

export enum Mark {
  From = 'from',
  To = 'to',
  None = 'none'
}

export default class Group {
  private readonly groupStore: GroupStore;
  private readonly dbServerStore: DbServerStore;
  private readonly userStore: UserStore;
  readonly id: string;
  readonly createdAt: string;
  @observable isPrivate: boolean;
  @observable name: string;
  members = observable<GroupMember>([]);
  dbServerIds = observable(new Set<string>());

  constructor(groupStore: GroupStore, dbServerStore: DbServerStore, userStore: UserStore, props: GroupProps) {
    this.groupStore = groupStore;
    this.userStore = userStore;
    this.dbServerStore = dbServerStore;
    this.id = props.id;
    this.isPrivate = props.is_private;
    this.createdAt = props.created_at;
    this.members.replace(props.members.map((member) => new GroupMember(groupStore, userStore, member)));
    this.dbServerIds.replace(new Set(props.db_servers.map((dbServer) => dbServer.id)));
    this.name = props.name;
  }

  @computed
  get users(): GroupUser[] {
    return rejectUndefined(Array.from(this.members).map((member) => member.user));
  }

  @computed
  get userIds(): string[] {
    return this.members.map((member) => member.userId);
  }

  @computed
  get dbServers(): DbServer[] {
    return rejectUndefined(
      Array.from(this.dbServerIds).map((id) => this.dbServerStore.dbServers.find((u) => u.id === id))
    );
  }

  @computed
  get admins(): GroupUser[] {
    return rejectUndefined(
      Array.from(this.members)
        .filter((member) => member.isAdmin)
        .map((member) => member.user)
    );
  }

  @action
  setAsActiveCard() {
    this.groupStore.setActiveGroupId(this.id);
  }

  @computed
  get isAdmin(): boolean {
    return this.admins.some((user) => user.id === this.userStore.loggedInUser.id);
  }

  @action
  togglePublicPrivate() {
    this.isPrivate = !this.isPrivate;
  }

  @computed
  get isMember(): boolean {
    return this.users.some((user) => user.id === this.userStore.loggedInUser.id);
  }

  @computed
  get isPublic(): boolean {
    return !this.isPrivate;
  }

  @computed
  get currentMember(): GroupMember | undefined {
    return this.members.find((member) => member.user?.id === this.userStore.loggedInUser.id);
  }

  @computed
  get outdatedMembers(): GroupUser[] {
    return rejectUndefined(this.members.filter((member) => member.isOutdated).map((member) => member.user));
  }

  @action
  setAdminRights(member: User, isAdmin: boolean) {}

  @computed
  get memberCount(): number {
    return this.members.length;
  }

  @computed
  get dbServerCount(): number {
    return this.dbServerIds.size;
  }
}
