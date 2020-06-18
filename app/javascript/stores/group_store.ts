import { observable, action, computed, reaction } from 'mobx';
import { RootStore, Store } from './root_store';
import _ from 'lodash';
import { getGroups } from '../api/group';
import DbServer from '../models/DbServer';
import User from '../models/User';
import Group from '../models/Group';

class State {
  groups = observable<Group>([]);
  expandedGroups = observable(new Set<string>([]));
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
  get groups(): Group[] {
    return this.state.groups;
  }

  @computed
  get publicGroups(): Group[] {
    return this.state.groups.filter(group => !group.isMember);
  }

  @computed
  get myGroups(): Group[] {
    return this.state.groups.filter(group => group.isMember);
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
  loadGroups() {
    getGroups(this.root.cancelToken).then(({ data }) => {
      data.forEach((group) => {
        group.db_servers.forEach((dbServer) => {
          if (!this.root.dbServer.dbServers.find(db => db.id === dbServer.id)) {
            this.root.dbServer.dbServers.push(
              new DbServer(dbServer, this.root.dbServer, this.root.schemaQueryStore, this.root.cancelToken)
            );
          }
        });
        group.users.forEach((user) => {
          if (!this.root.user.users.find(u => u.id === user.id)) {
            this.root.user.users.push(new User(user));
          }
        });

        this.groups.push(new Group(this.root.dbServer, this.root.user, group));
      });
    });
  }

  @action cleanup() {
    this.state = new State();
  }
}

export default GroupStore;
