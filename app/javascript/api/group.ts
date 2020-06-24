import api from './base';
import { AxiosPromise, CancelTokenSource } from 'axios';
import { DbServer } from './db_server';

export interface GroupMember {
  is_admin: boolean;
  is_outdated: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export enum Changeable {
  IsPrivate = 'is_private',
  Name = 'name',
  Description = 'description'
}

export interface ChangeableProps {
  [Changeable.IsPrivate]: boolean;
  [Changeable.Name]: string;
  [Changeable.Description]: string;
}

export interface Group extends ChangeableProps {
  id: string;
  is_member: boolean;
  updated_at: string;
  created_at: string;
  db_servers: DbServer[];
  members?: GroupMember[];
}

export function getGroups(cancelToken: CancelTokenSource): AxiosPromise<Group[]> {
  return api.get('groups', { cancelToken: cancelToken.token });
}

export function getGroup(id: string): AxiosPromise<Group> {
  return api.get(`groups/${id}`);
}

export function getPublicGroups(
  offset: number,
  limit: number,
  cancelToken: CancelTokenSource
): AxiosPromise<Group[]> {
  return api.get('groups/public', {
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
  return api.post(`groups/${groupId}/members`, { user_id: newMemberId });
}

export function update(groupId: string, data: ChangeableProps): AxiosPromise<Group> {
  return api.put(`groups/${groupId}`, {
    data: data
  });
}

export function generateNewCryptoKey(groupId: string): AxiosPromise<Group> {
  return api.post(`groups/${groupId}/generate_new_crypto_key`);
}


export function remove(groupId: string): AxiosPromise<void> {
  return api.delete(`groups/${groupId}`);
}

export function create(name: string, description: string, isPrivate: boolean): AxiosPromise<Group> {
  return api.post('groups', {
    name: name,
    description: description,
    is_private: isPrivate
  })
}
