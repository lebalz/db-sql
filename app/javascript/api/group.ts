import api from './base';
import { AxiosPromise, CancelTokenSource } from 'axios';
import { DbServer } from './db_server';
import { GroupUser } from './user';

export interface GroupMember {
  is_admin: boolean;
  is_outdated: boolean;
  group_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Group {
  id: string;
  is_private: boolean;
  name: string;
  created_at: string;
  db_servers: DbServer[];
  members: GroupMember[];
}

export function getGroups(cancelToken: CancelTokenSource): AxiosPromise<Group[]> {
  return api.get('groups', { cancelToken: cancelToken.token });
}

export function getPublicGroups(
  offset: number,
  limit: number,
  cancelToken: CancelTokenSource
): AxiosPromise<Group> {
  return api.get('public_groups', {
    cancelToken: cancelToken.token,
    params: { offset: offset, limit: limit }
  });
}

export function setAdminPermission(
  groupId: string,
  userId: string,
  isAdmin: boolean
): AxiosPromise<GroupMember> {
  return api.post(`groups/${groupId}/members/${userId}/set_admin_permission`, {
    is_admin: isAdmin
  });
}

export function removeMember(groupId: string, userId: string): AxiosPromise<void> {
  return api.delete(`groups/${groupId}/members/${userId}`);
}

export function addGroupMember(groupId: string, newMemberId: string): AxiosPromise<GroupMember> {
  return api.post(`groups/${groupId}/members`, { user_id: newMemberId});
}