import { observable, action, computed } from 'mobx';
import { RootStore, Store } from './root_store';
import User from '../models/User';
import _ from 'lodash';
import { users, deleteUser, updateUser as apiUpdate, user as apiUser } from '../api/admin';

export enum ReloadState {
  None,
  Loading,
  Success,
  Error
}

export enum SortableUserColumns {
  Email = 'email',
  CreatedAt = 'createdAt',
  UpdatedAt = 'updatedAt',
  LoginCount = 'loginCount',
  Role = 'role',
  QueryCount = 'queryCount',
  ErrorQueryCount = 'errorQueryCount',
  Activated = 'activated'
}

export const DEFAULT_SORT_ORDER: { [key in SortableUserColumns]: 'asc' | 'desc' } = {
  [SortableUserColumns.Email]: 'asc',
  [SortableUserColumns.CreatedAt]: 'desc',
  [SortableUserColumns.UpdatedAt]: 'desc',
  [SortableUserColumns.LoginCount]: 'desc',
  [SortableUserColumns.Role]: 'asc',
  [SortableUserColumns.QueryCount]: 'desc',
  [SortableUserColumns.ErrorQueryCount]: 'desc',
  [SortableUserColumns.Activated]: 'asc'
};

class State {
  users = observable<User>([]);
  @observable userFilter: string = '';
  @observable sortColumn: SortableUserColumns = SortableUserColumns.Email;
  @observable order: 'asc' | 'desc' = 'asc';
  @observable reloadState = ReloadState.None;
}

class UserStore implements Store {
  private readonly root: RootStore;
  @observable.ref
  private state = new State();

  constructor(root: RootStore) {
    this.root = root;
  }

  @action
  setUserFilter(filter: string) {
    this.state.userFilter = filter;
  }

  @computed
  get userFilter() {
    return this.state.userFilter;
  }

  @computed
  get sortColumn() {
    return this.state.sortColumn;
  }

  @action
  setSortColumn(sortColumn: SortableUserColumns) {
    this.state.sortColumn = sortColumn;
  }

  @computed
  get order() {
    return this.state.order;
  }

  @action
  toggleOrder() {
    this.state.order = this.state.order === 'asc' ? 'desc' : 'asc';
  }

  @action
  setSortOrder(order: 'asc' | 'desc') {
    this.state.order = order;
  }

  @computed
  get filteredUsers(): User[] {
    const escapedFilter = _.escapeRegExp(this.userFilter);
    const regexp = new RegExp(escapedFilter, 'i');

    const filtered = this.users.filter((user) => regexp.test(user.email));

    return _.orderBy(filtered, this.sortColumn, this.order);
  }

  @action loadUsers() {
    this.state.reloadState = ReloadState.Loading;
    users(this.root.cancelToken)
      .then(({ data }) => {
        const users = _.sortBy(data, ['email']).map((user) => new User(user));
        this.state.users.replace(users);
        this.state.reloadState = ReloadState.Success;
      })
      .catch(() => {
        console.log('No admin authorization');
        this.state.users.replace([]);
        this.state.reloadState = ReloadState.Error;
      })
      .then((result) => new Promise((resolve) => setTimeout(resolve, 2000, result)))
      .finally(() => (this.state.reloadState = ReloadState.None));
  }

  @action updateUser(id: string, update: Partial<User>) {
    apiUpdate(id, update, this.root.cancelToken)
      .then(() => apiUser(id, this.root.cancelToken))
      .then(({ data }) => {
        const oldUser = this.state.users.find((user) => user.id === id);
        if (!oldUser) return;

        this.state.users.remove(oldUser);
        this.state.users.push(new User(data));
      })
      .catch((e) => console.log(e));
  }

  @action deleteUser(id: string) {
    deleteUser(id, this.root.cancelToken)
      .then(() => {
        const user = this.state.users.find((user) => user.id === id);
        user && this.state.users.remove(user);
      })
      .catch((error) => {
        console.log(error);
      });
  }

  @computed
  get reloadState() {
    return this.state.reloadState;
  }

  @computed
  get users() {
    return this.state.users;
  }

  @action cleanup() {
    this.state = new State();
  }
}

export default UserStore;
