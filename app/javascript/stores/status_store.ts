import { observable, action, computed } from 'mobx';
import { RootStore, Store } from './root_store';
import _ from 'lodash';
import { getCommit, Commit } from '../api/status';

class State {
  @observable commit: Commit = { commit: '', link: '' }
}

class StatusStore implements Store {
  private readonly root: RootStore;
  @observable.ref
  private state = new State();

  constructor(root: RootStore) {
    this.root = root;
    this.loadCommit();
  }

  @action
  loadCommit() {
    getCommit().then(({ data }) => {
      this.state.commit = data;
    });
  }

  @computed
  get commit() {
    return this.state.commit;
  }

  @action cleanup() {
    this.state = new State();
  }
}

export default StatusStore;
