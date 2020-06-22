import { observable, action, computed, reaction, IObservableArray } from 'mobx';
import { RootStore, Store } from './root_store';
import _ from 'lodash';
import { getGroups, create, update, remove, getPublicGroups, addGroupMember, getGroup } from '../api/group';
import DbServer from '../models/DbServer';
import Group from '../models/Group';
import { GroupUser } from '../api/user';
import { REST } from '../declarations/REST';
import User from '../models/User';
import GroupMember from '../models/GroupMember';

class State {
  groups = observable<Group>([]);
  reducedGroups = observable<string>([]);
  @observable activeGroupCardId?: string;
  @observable activePublicGroupId?: string;
  @observable userFilter?: string;
  @observable groupFilter: string = '';
  @observable publicGroupFilter: string = '';
  @observable requestState: REST = REST.None;
}

class GroupStore implements Store {
  private readonly root: RootStore;
  @observable.ref
  private state = new State();

  constructor(root: RootStore) {
    this.root = root;
    reaction(
      () => this.root.session.isLoggedIn,
      (isLoggedIn) => {
        if (isLoggedIn) {
          this.loadGroups();
          this.loadPublicGroups();
        }
      }
    );
  }

  @computed
  get requestState(): REST {
    return this.state.requestState;
  }

  @computed
  get activeGroupId(): string | undefined {
    return this.state.activeGroupCardId ?? this.myGroups[0]?.id;
  }

  @computed
  get activePublicGroupId(): string | undefined {
    return this.state.activePublicGroupId ?? this.publicGroups[0]?.id;
  }

  @computed
  get activeGroup(): Group | undefined {
    return this.groups.find((group) => group.id === this.activeGroupId) ?? this.myGroups[0];
  }

  @computed
  get activePublicGroup(): Group | undefined {
    return this.groups.find((group) => group.id === this.activePublicGroupId)?? this.publicGroups[0];
  }

  @action
  setActiveGroupId(id?: string) {
    if (!this.groups.find((group) => group.id === id)) {
      if (this.myGroups.length > 0) {
        this.state.activeGroupCardId = this.myGroups[0].id;
      }
      return;
    }
    this.state.activeGroupCardId = id;
  }

  @action
  setActivePublicGroupId(id?: string) {
    if (!this.groups.find((group) => group.id === id)) {
      if (this.publicGroups.length > 0) {
        this.state.activePublicGroupId = this.publicGroups[0].id;
      }
      return;
    }
    this.state.activePublicGroupId = id;
  }

  @computed
  get userFilter(): string {
    return this.state.userFilter || '';
  }

  @computed
  get groupFilter(): string {
    return this.state.groupFilter;
  }

  @computed
  get publicGroupFilter(): string {
    return this.state.publicGroupFilter;
  }

  @action
  setGroupFilter(filter: string) {
    this.state.groupFilter = filter;
  }

  @action
  setPublicGroupFilter(filter: string) {
    this.state.publicGroupFilter = filter;
  }

  @computed
  get filteredGroupUsers(): GroupUser[] {
    const escapedFilter = _.escapeRegExp(this.userFilter);
    const regexp = new RegExp(escapedFilter, 'i');

    const filtered = this.root.user.groupUsers
      .filter((user) => !this.activeGroup?.userIds.includes(user.id))
      .filter((user) => regexp.test(user.email));

    return _.orderBy(filtered, 'email', 'asc');
  }

  @computed
  get groups(): Group[] {
    return _.orderBy(this.state.groups, ['updatedAt'], 'desc');
  }

  @computed
  get publicGroups(): Group[] {
    return this.groups.filter((group) => !group.isMember);
  }

  @computed
  get myGroups(): Group[] {
    return this.groups.filter((group) => group.isMember);
  }

  @computed
  get myAdminGroups(): Group[] {
    return this.groups.filter((group) => group.isAdmin);
  }

  @computed
  get reducedDashboardGroups(): IObservableArray<string> {
    return this.state.reducedGroups;
  }

  @action
  toggleExpanded(groupId: string) {
    if (this.reducedDashboardGroups.includes(groupId)) {
      this.reducedDashboardGroups.remove(groupId);
    } else {
      this.reducedDashboardGroups.push(groupId);
    }
  }

  @action
  addNewGroup() {
    this.state.requestState = REST.Requested;
    create('New Group', '', true)
      .then(({ data }) => {
        this.state.groups.push(new Group(this, this.root.dbServer, this.root.user, true, data));
        this.setActiveGroupId(data.id);
        this.state.requestState = REST.Success;
      })
      .catch((error) => {
        this.state.requestState = REST.Error;
      });
  }

  @action
  loadPublicGroups(): Promise<boolean> {
    return getPublicGroups(0, -1, this.root.cancelToken).then(({data}) => {
      data.forEach((group) => {
        group.db_servers.forEach((dbServer) => {
          if (!this.root.dbServer.dbServers.find((db) => db.id === dbServer.id)) {
            this.root.dbServer.dbServers.push(
              new DbServer(dbServer, this.root.dbServer, this.root.schemaQueryStore, this.root.cancelToken)
            );
          }
        });

        this.state.groups.push(new Group(this, this.root.dbServer, this.root.user, false, group));
      })
      return true;
    });
  }

  @action
  loadGroups(): Promise<boolean> {
    return getGroups(this.root.cancelToken).then(({ data }) => {
      data.forEach((group) => {
        group.db_servers.forEach((dbServer) => {
          if (!this.root.dbServer.dbServers.find((db) => db.id === dbServer.id)) {
            this.root.dbServer.dbServers.push(
              new DbServer(dbServer, this.root.dbServer, this.root.schemaQueryStore, this.root.cancelToken)
            );
          }
        });

        this.state.groups.push(new Group(this, this.root.dbServer, this.root.user, true, group));
      });
      if (this.myGroups.length > 0) {
        this.setActiveGroupId(this.myGroups[0].id);
      }
      return true;
    });
  }

  @action
  addMemberToGroup(group: Group, user: User) {
    addGroupMember(group.id, user.id).then(({ data }) => {
      if (group.isMember) {
        const oldGroup = group.members.find(member => member.userId === user.id && member.groupId === group.id);
        if (oldGroup) {
          group.members.remove(oldGroup);
        }
        group.members.push(new GroupMember(this, this.root.user, group.id, data));
      } else {
        this.reloadGroup(group.id).then(() => {
          this.root.routing.push('my_groups');
          this.setActiveGroupId(group.id);
        });
      }
    });
  }

  @action
  reloadGroup(id: string): Promise<void> {
    return getGroup(id).then(({data}) => {
      data.db_servers.forEach((dbServer) => {
        const oldDbServer = this.root.dbServer.dbServers.find((db) => db.id === dbServer.id);
        if (oldDbServer) {
          this.root.dbServer.dbServers.remove(oldDbServer);
        }
        this.root.dbServer.dbServers.push(
          new DbServer(dbServer, this.root.dbServer, this.root.schemaQueryStore, this.root.cancelToken)
        );
      });
      const oldGroup = this.state.groups.find(group => group.id);
      if (oldGroup) {
        this.state.groups.remove(oldGroup);
      }
      this.state.groups.push(new Group(this, this.root.dbServer, this.root.user, true, data));
    })
  }

  @action
  create(group: Group) {
    if (group.isPersisted) {
      return;
    }
    this.state.requestState = REST.Requested;
    create(group.name, group.description, group.isPrivate)
      .then(({ data }) => {
        this.state.groups.remove(group);
        this.state.groups.push(new Group(this, this.root.dbServer, this.root.user, true, data));
        this.setActiveGroupId(data.id);
        this.state.requestState = REST.Success;
      })
      .catch((error) => {
        this.state.requestState = REST.Error;
      });
  }

  @action
  save(group: Group) {
    if (!group.isDirty || !group.isPersisted) {
      return;
    }
    update(group.id, group.changeablProps)
      .then(({ data }) => {
        this.state.groups.remove(group);
        this.state.groups.push(new Group(this, this.root.dbServer, this.root.user, true, data));
        this.setActiveGroupId(data.id);
        this.state.requestState = REST.Success;
      })
      .catch((error) => {
        this.state.requestState = REST.Error;
      });
  }

  @action
  refresh() {
    const currentId = this.activeGroupId;
    this.state = new State();
    this.loadGroups().then(() => {
      this.setActiveGroupId(currentId);
    });
  }

  @action
  destroy(group: Group) {
    this.state.requestState = REST.Requested;
    remove(group.id)
      .then(() => {
        this.state.requestState = REST.Success;
        this.state.groups.remove(group);
        this.setActiveGroupId();
      })
      .catch(() => {
        this.state.requestState = REST.Error;
      });
  }

  @action cleanup() {
    this.state = new State();
  }
}

export default GroupStore;
