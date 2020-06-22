import { observable, computed, action } from 'mobx';
import _ from 'lodash';
import {
  GroupMember as GroupMemberProps,
  setAdminPermission as changeAdminPermission,
  removeMember
} from '../api/group';
import GroupStore from '../stores/group_store';
import Group from './Group';
import { GroupUser } from '../api/user';
import UserStore from '../stores/user_store';

export enum Mark {
  From = 'from',
  To = 'to',
  None = 'none'
}

export default class GroupMember {
  private readonly groupStore: GroupStore;
  private readonly userStore: UserStore;

  @observable isAdmin: boolean;
  readonly isOutdated: boolean;
  readonly groupId: string;
  readonly userId: string;
  readonly created_at: string;
  readonly updated_at: string;

  constructor(groupStore: GroupStore, userStore: UserStore, groupId: string, props: GroupMemberProps) {
    this.groupStore = groupStore;
    this.userStore = userStore;
    this.isAdmin = props.is_admin;
    this.isOutdated = props.is_outdated;
    this.groupId = groupId;
    this.created_at = props.created_at;
    this.updated_at = props.updated_at;
    this.userId = props.user_id;
  }

  @computed
  get group(): Group {
    return this.groupStore.groups.find((group) => group.id === this.groupId)!;
  }

  @computed
  get user(): GroupUser | undefined {
    return this.userStore.groupUsers.find((user) => user.id === this.userId)!;
  }

  @computed
  get isCurrentUser(): boolean {
    return this.userId === this.userStore.loggedInUser.id;
  }

  @action
  setAdminPermission(isAdmin: boolean) {
    if (!this.user) {
      return;
    }
    changeAdminPermission(this.groupId, this.user.id, isAdmin).then(({ data }) => {
      this.isAdmin = data.is_admin;
    });
  }

  @action
  remove() {
    if (!this.user) {
      return;
    }
    removeMember(this.groupId, this.user.id).then(() => {
      this.group.members.remove(this);
    });
  }
}
