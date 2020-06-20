import { observable, action, computed, reaction } from 'mobx';
import { RootStore, Store } from './root_store';
import _ from 'lodash';
import { getGroups } from '../api/group';
import DbServer from '../models/DbServer';
import Group from '../models/Group';
import { GroupUser } from '../api/user';

class State {
  groups = observable<Group>([]);
  expandedGroups = observable(new Set<string>([]));
  @observable activeGroupCardId?: string;
  @observable userFilter?: string;
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
        }
      }
    );
  }

  @computed
  get activeGroupId(): string | undefined {
    return this.state.activeGroupCardId;
  }

  @computed
  get activeGroup(): Group | undefined {
    return this.groups.find((group) => group.id === this.activeGroupId);
  }

  @action
  setActiveGroupId(id: string) {
    this.state.activeGroupCardId = id;
  }

  @computed
  get userFilter(): string {
    return this.state.userFilter || '';
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
    return this.state.groups;
  }

  @computed
  get publicGroups(): Group[] {
    return this.state.groups.filter((group) => !group.isMember);
  }

  @computed
  get myGroups(): Group[] {
    return this.state.groups.filter((group) => group.isMember);
  }

  @computed
  get expandedGroups(): Set<string> {
    return this.state.expandedGroups;
  }

  @action
  toggleExpanded(groupId: string) {
    if (this.expandedGroups.has(groupId)) {
      this.expandedGroups.delete(groupId);
    } else {
      this.expandedGroups.add(groupId);
    }
  }

  @action
  addNewGroup() {
    const tempId = `${Date.now()}`;
    this.groups.push(
      new Group(this, this.root.dbServer, this.root.user, {
        id: tempId,
        created_at: new Date().toISOString(),
        members: [
          {
            created_at: new Date().toISOString(),
            group_id: tempId,
            is_admin: true,
            is_outdated: false,
            updated_at: new Date().toISOString(),
            user_id: this.root.session.currentUser.id
          }
        ],
        db_servers: [],
        is_private: true,
        name: 'New Group'
      })
    );
    this.setActiveGroupId(tempId);
  }

  @action
  loadGroups() {
    getGroups(this.root.cancelToken).then(({ data }) => {
      data.forEach((group) => {
        group.db_servers.forEach((dbServer) => {
          if (!this.root.dbServer.dbServers.find((db) => db.id === dbServer.id)) {
            this.root.dbServer.dbServers.push(
              new DbServer(dbServer, this.root.dbServer, this.root.schemaQueryStore, this.root.cancelToken)
            );
          }
        });

        this.groups.push(new Group(this, this.root.dbServer, this.root.user, group));
      });
    });
  }

  @action cleanup() {
    this.state = new State();
  }
}

export default GroupStore;
