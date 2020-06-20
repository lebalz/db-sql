import { observable, computed, action } from 'mobx';
import _ from 'lodash';
import {
  GroupMember as GroupMemberProps,
  GroupUser,
  setAdminPermission as changeAdminPermission
} from '../api/group';
import GroupStore from '../stores/group_store';
import Group from './Group';

export enum Mark {
  From = 'from',
  To = 'to',
  None = 'none'
}

export default class GroupMember {
  private readonly groupStore: GroupStore;

  @observable isAdmin: boolean;
  readonly isOutdated: boolean;
  readonly groupId: string;
  readonly user: GroupUser;
  readonly created_at: string;
  readonly updated_at: string;

  constructor(groupStore: GroupStore, props: GroupMemberProps) {
    this.groupStore = groupStore;
    this.isAdmin = props.is_admin;
    this.isOutdated = props.is_outdated;
    this.groupId = props.group_id;
    this.created_at = props.created_at;
    this.updated_at = props.updated_at;
    this.user = props.user;
  }

  @computed
  get group(): Group {
    return this.groupStore.groups.find((group) => group.id === this.groupId)!;
  }

  @action
  setAdminPermission(isAdmin: boolean) {
    changeAdminPermission(this.groupId, this.user.id, isAdmin).then(({data}) => {
      this.isAdmin = data.is_admin;
    })
  }
}
