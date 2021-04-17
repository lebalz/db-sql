import { observable, action, autorun } from 'mobx';
import { RootStore } from './root_store';
import _ from 'lodash';
import { DEFAULT_HEIGHT } from '../components/Workbench/SqlResult/ResultTable';
import { Graph } from '../models/Graphs/WordcloudGraph';

class ResultTableState {
  @observable row = 0;
  @observable rowHeight = DEFAULT_HEIGHT;
  @observable wrapperHeight = DEFAULT_HEIGHT * 20;
  @observable preventNextScrollUpdate = false;
  @observable x = 0;
  @observable y = 0;
  @observable showGraph = false;

  @observable.ref
  graph?: Graph;
}

class State {
  @observable.ref
  resultTable = observable(new Map<string, ResultTableState>());
}

class ViewStateStore {
  @observable.ref
  private state = new State();

  constructor(root: RootStore) {
  }

  resultTableState(key: string): ResultTableState {
    if (!this.state.resultTable.has(key)) {
      this.state.resultTable.set(key, new ResultTableState());
    }
    return this.state.resultTable.get(key)!;
  }

  @action
  resetScrollState(key: string, rowHeight: number, clientHeight: number) {
    const state = this.resultTableState(key);

    state.rowHeight = rowHeight;
    state.preventNextScrollUpdate = false;
    state.wrapperHeight = clientHeight;
    state.x = 0;
    state.y = 0;
  }

  @action
  cleanResultTableState(key: string) {
    console.log('cleanup: ', key);
    this.state.resultTable.delete(key);
  }

  @action cleanup() {
    this.state = new State();
  }
}

export default ViewStateStore;
