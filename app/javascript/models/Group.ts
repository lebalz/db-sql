import { observable, computed, action } from 'mobx';
import _ from 'lodash';
import { Group as GroupProps, ChangeableProps, Changeable } from '../api/group';
import DbServerStore from '../stores/db_server_store';
import UserStore from '../stores/user_store';
import DbServer from './DbServer';
import { rejectUndefined } from '../utils/listFilters';
import User from './User';
import GroupStore from '../stores/group_store';
import GroupMember from './GroupMember';
import { GroupMember as GroupMemberProps } from '../api/group';
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
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly pristineState: ChangeableProps;
  readonly isPersisted: boolean;
  readonly isMember: boolean;
  @observable isPrivate: boolean;
  @observable name: string;
  @observable description: string;
  members = observable<GroupMember>([]);
  dbServerIds = observable<string>([]);

  constructor(
    groupStore: GroupStore,
    dbServerStore: DbServerStore,
    userStore: UserStore,
    isMember: boolean,
    props: GroupProps,
    persisted: boolean = true
  ) {
    this.isPersisted = persisted;
    this.groupStore = groupStore;
    this.userStore = userStore;
    this.dbServerStore = dbServerStore;
    this.id = props.id;
    this.isPrivate = props.is_private;
    this.isMember = isMember;
    this.createdAt = new Date(props.created_at);
    this.updatedAt = new Date(props.updated_at);
    this.members.replace(
      (props.members ?? []).map((member) => new GroupMember(groupStore, userStore, props.id, member))
    );
    this.dbServerIds.replace(props.db_servers.map((dbServer) => dbServer.id));
    this.name = props.name;
    this.description = props.description;
    this.pristineState = {
      is_private: props.is_private,
      description: props.description,
      name: props.name
    };
  }

  @computed
  get changeablProps(): ChangeableProps {
    return {
      name: this.name,
      is_private: this.isPrivate,
      description: this.description
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

  @computed
  get users(): GroupUser[] {
    return rejectUndefined(this.members.map((member) => member.user));
  }

  @computed
  get userIds(): string[] {
    return this.members.map((member) => member.userId);
  }

  @computed
  get dbServers(): DbServer[] {
    return rejectUndefined(
      this.dbServerIds.map((id) => this.dbServerStore.dbServers.find((u) => u.id === id))
    );
  }

  @computed
  get admins(): GroupUser[] {
    return rejectUndefined(this.members.filter((member) => member.isAdmin).map((member) => member.user));
  }

  @action
  setAsActiveCard() {
    if (this.isMember) {
      this.groupStore.setActiveGroupId(this.id);
    } else {
      this.groupStore.setActivePublicGroupId(this.id);
    }
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
  get isPublic(): boolean {
    return !this.isPrivate;
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
    return this.dbServerIds.length;
  }

  @action
  addMember(groupMember: GroupMemberProps) {
    this.members.push(new GroupMember(this.groupStore, this.userStore, this.id, groupMember));
  }

  @action
  save() {
    if (this.isPersisted) {
      this.groupStore.save(this);
    } else {
      this.groupStore.create(this);
    }
  }

  @action
  restore() {
    this.isPrivate = this.pristineState.is_private;
    this.name = this.pristineState.name;
    this.description = this.pristineState.description;
  }

  @action
  destroy() {
    this.groupStore.destroy(this);
  }
}
