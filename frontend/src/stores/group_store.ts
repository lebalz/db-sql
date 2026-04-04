import { observable, action, computed, reaction, IObservableArray } from 'mobx';
import { RootStore, Store } from './root_store';
import _ from 'lodash';
import {
  getGroups,
  create,
  update,
  remove,
  getPublicGroups,
  addGroupMember,
  getGroup,
  removeMember,
  generateNewCryptoKey as requestNewCryptoKey,
  Group as GroupProps
} from '../api/group';
import Group from '../models/Group';
import { UserProfile } from '../api/user';
import { REST } from '../declarations/REST';
import User from '../models/User';
import GroupMember from '../models/GroupMember';
import { computedFn } from 'mobx-utils';

export enum MemberType {
  Public,
  Joined
}

class State {
  joinedGroups = observable<Group>([]);
  publicGroups = observable<Group>([]);
  reducedGroups = observable<string>([]);
  @observable activeGroup: { [key in MemberType]?: string } = {};
  @observable userFilter?: string;
  @observable groupFilter: string = '';
  @observable publicGroupFilter: string = '';
  @observable requestState: REST = REST.None;
}

class GroupStore implements Store {
  private readonly root: RootStore;
  @observable.ref
  private state = new State();
  @observable initialized: boolean = false;

  constructor(root: RootStore) {
    this.root = root;
    reaction(
      () => this.root.session.isLoggedIn,
      (isLoggedIn) => {
        if (isLoggedIn) {
          Promise.all([this.loadGroups(), this.loadPublicGroups()]).then(() => {
            this.initialized = true;
          });
        } else {
          this.initialized = false;
        }
      }
    );
  }

  @computed
  get groups(): Group[] {
    return [...this.joinedGroups, ...this.publicGroups];
  }

  find = computedFn(
    function (this: GroupStore, id?: string): Group | undefined {
      if (!id) {
        return;
      }
      return this.groups.find((group) => group.id === id);
    },
    { keepAlive: true }
  );

  @computed
  get requestState(): REST {
    return this.state.requestState;
  }

  @computed
  get activeGroups(): { [key in MemberType]?: string } {
    return this.state.activeGroup;
  }

  @computed
  get activeGroup(): Group | undefined {
    return this.find(this.activeGroups[MemberType.Joined]) ?? this.joinedGroups[0];
  }

  @computed
  get activePublicGroup(): Group | undefined {
    return this.find(this.activeGroups[MemberType.Public]) ?? this.publicGroups[0];
  }

  @action
  setActiveGroupId(type: MemberType, id?: string) {
    this.state.activeGroup[type] = id;
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
  get filteredUserProfiles(): UserProfile[] {
    const escapedFilter = _.escapeRegExp(this.userFilter);
    const regexp = new RegExp(escapedFilter, 'i');

    const filtered = this.root.user.groupUsers
      .filter((user) => !this.activeGroup?.userIds.includes(user.id))
      .filter((user) => regexp.test(user.email));

    return _.orderBy(filtered, 'email', 'asc');
  }

  @computed
  get publicGroups(): Group[] {
    return _.orderBy(this.state.publicGroups, 'updatedAt', 'desc');
  }

  @computed
  get joinedGroups(): Group[] {
    return _.orderBy(this.state.joinedGroups, 'updatedAt', 'desc');
  }

  @computed
  get adminGroups(): Group[] {
    return this.joinedGroups.filter((group) => group.isAdmin);
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
        this.state.joinedGroups.push(new Group(this, this.root.dbServer, this.root.user, data));
        this.setActiveGroupId(MemberType.Joined, data.id);
        this.state.requestState = REST.Success;
      })
      .catch(() => {
        this.state.requestState = REST.Error;
      });
  }

  @action
  addMemberToGroup(group: Group, user: User) {
    addGroupMember(group.id, user.id).then(({ data }) => {
      if (group.isMember) {
        const oldGroup = group.members.find(
          (member) => member.userId === user.id && member.groupId === group.id
        );
        if (oldGroup) {
          group.members.remove(oldGroup);
        }
        group.members.push(new GroupMember(this, this.root.user, group.id, data));
      } else {
        this.state.publicGroups.remove(group);
        this.reloadGroup(group.id);
      }
    });
  }

  @action
  removeMemberFromGroup(group: Group, userId: string) {
    removeMember(group.id, userId).then(() => {
      if (userId === this.root.session.currentUser.id) {
        this.state.joinedGroups.remove(group);
        if (group.isPublic) {
          this.reloadGroup(group.id);
        }
      } else {
        const member = group.members.find((member) => member.userId === userId);
        if (member) {
          group.members.remove(member);
        }
      }
    });
  }

  @action
  loadPublicGroups(): Promise<boolean> {
    return getPublicGroups(0, -1, this.root.cancelToken).then(({ data }) => {
      data.forEach((group) => {
        this.root.dbServer.addDbServers(group.db_servers);
        const oldGroup = this.find(group.id);
        if (oldGroup) {
          if (oldGroup.isMember) {
            this.state.joinedGroups.remove(oldGroup);
          } else {
            this.state.publicGroups.remove(oldGroup);
          }
        }
        this.state.publicGroups.push(new Group(this, this.root.dbServer, this.root.user, group));
      });
      return true;
    });
  }

  @action
  loadGroups(): Promise<boolean> {
    return getGroups(this.root.session.currentUser.id, this.root.cancelToken).then(({ data }) => {
      data.forEach((group) => {
        const hasDbServers = group.db_servers.length > 0;
        const isOutdated = group.members?.some(
          (member) => member.is_outdated && member.user_id === this.root.user.loggedInUser.id
        );
        if ((!hasDbServers || isOutdated) && !this.reducedDashboardGroups.includes(group.id)) {
          this.reducedDashboardGroups.push(group.id);
        }

        this.replaceGroup(group);
      });
      if (this.joinedGroups.length > 0) {
        this.setActiveGroupId(MemberType.Joined, this.joinedGroups[0].id);
      }
      return true;
    });
  }

  @action
  generateNewCryptoKey(id: string) {
    requestNewCryptoKey(id).then(({ data }) => {
      return this.replaceGroup(data);
    });
  }

  @action
  reloadGroup(id: string, showAfterFetch: boolean = true) {
    getGroup(id)
      .then(({ data }) => {
        return this.replaceGroup(data);
      })
      .then((group) => {
        if (showAfterFetch) {
          if (group.isMember) {
            this.root.routing.push('my_groups');
            this.setActiveGroupId(MemberType.Joined, group.id);
          } else {
            this.root.routing.push('public_groups');
            this.setActiveGroupId(MemberType.Public, group.id);
          }
        }
      });
  }

  @action
  private replaceGroup(group: GroupProps) {
    const oldGroup = this.find(group.id);
    if (oldGroup) {
      if (oldGroup.isMember) {
        this.state.joinedGroups.remove(oldGroup);
      } else {
        this.state.publicGroups.remove(oldGroup);
      }
    }
    this.root.dbServer.addDbServers(group.db_servers);

    const newGroup = new Group(this, this.root.dbServer, this.root.user, group);
    if (newGroup.isMember) {
      this.state.joinedGroups.push(newGroup);
    } else {
      this.state.publicGroups.push(newGroup);
    }
    return newGroup;
  }

  @action
  create(group: Group) {
    if (group.isPersisted) {
      return;
    }
    this.state.requestState = REST.Requested;
    create(group.name, group.description, group.isPrivate)
      .then(({ data }) => {
        this.state.joinedGroups.remove(group);
        this.state.joinedGroups.push(new Group(this, this.root.dbServer, this.root.user, data));
        this.setActiveGroupId(MemberType.Joined, data.id);
        this.state.requestState = REST.Success;
      })
      .catch(() => {
        this.state.requestState = REST.Error;
      });
  }

  @action
  save(group: Group) {
    if (!group.isDirty || !group.isPersisted) {
      return;
    }
    update(group.id, group.changeableProps)
      .then(({ data }) => {
        this.state.joinedGroups.remove(group);
        this.state.joinedGroups.push(new Group(this, this.root.dbServer, this.root.user, data));
        this.setActiveGroupId(MemberType.Joined, data.id);
        this.state.requestState = REST.Success;
      })
      .catch(() => {
        this.state.requestState = REST.Error;
      });
  }

  @action
  refresh(memberType: MemberType) {
    const currentId = this.activeGroups[memberType];
    if (memberType === MemberType.Joined) {
      this.loadGroups().then(() => {
        this.setActiveGroupId(MemberType.Joined, currentId);
      });
    } else {
      this.loadPublicGroups().then(() => {
        this.setActiveGroupId(MemberType.Public, currentId);
      });
    }
  }

  @action
  destroy(group: Group) {
    this.state.requestState = REST.Requested;
    remove(group.id)
      .then(() => {
        this.state.requestState = REST.Success;
        this.state.joinedGroups.remove(group);
        this.setActiveGroupId(MemberType.Joined);
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
