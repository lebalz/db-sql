import { observable, action, computed } from 'mobx';
import { RootStore } from './root_store';
import _ from 'lodash';
import { DEFAULT_HEIGHT } from '../components/DatabaseServer/SqlResult/ResultTable';

class ResultTableState {
  @observable row = 0;
  @observable rowHeight = DEFAULT_HEIGHT;
  @observable wrapperHeight = DEFAULT_HEIGHT * 20;
  @observable preventNextScrollUpdate = false;
  @observable x = 0;
  @observable y = 0;
  selectedColumns = observable<number>([]);
}

class State {
  @observable.ref
  resultTable = observable(new Map<string, ResultTableState>());
}

class ViewStateStore {
  private readonly rootStore: RootStore;
  @observable.ref
  private state = new State();

  constructor(root: RootStore) {
    this.rootStore = root;
  }

  resultTableState(key: string): ResultTableState {
    if (!this.state.resultTable.has(key)) {
      this.state.resultTable.set(key, new ResultTableState());
    }
    return this.state.resultTable.get(key)!;
  }

  @action
  cleanResultTableState(key: string) {
    this.state.resultTable.delete(key);
  }

  @action cleanup() {
    this.state = new State();
  }
}

export default ViewStateStore;
