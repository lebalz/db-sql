import { observable, action, autorun, computed } from 'mobx';
import { RootStore } from './root_store';
import _ from 'lodash';
import { DEFAULT_HEIGHT } from '../components/Workbench/SqlResult/ResultTable';
import { Graph } from '../models/Graphs/WordcloudGraph';
import { select } from 'd3-selection';
import { CopyState } from '../models/Result';

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

class SqlQueryLogFilter {
  @observable
  private _dbServerId?: string;
  @observable
  private _dbName?: string;

  @observable
  executionState?: 'success' | 'error';

  @action
  toggleError() {
    if (this.executionState === 'error') {
      this.executionState = undefined;
    } else {
      this.executionState = 'error';
    }
  }
  @action
  toggleSuccess() {
    if (this.executionState === 'success') {
      this.executionState = undefined;
    } else {
      this.executionState = 'success';
    }
  }

  @computed
  get dbServerId() {
    return this._dbServerId;
  }

  @computed
  get dbName() {
    return this._dbName;
  }

  @action
  setDbServerId(id: string | undefined) {
    if (this._dbServerId === id) {
      return;
    }
    this._dbServerId = id;
    this._dbName = undefined;
  }

  @action
  setDbName(name: string | undefined) {
    if (this._dbName === name) {
      return;
    }
    this._dbName = name;
  }
}

class State {
  @observable.ref
  resultTable = observable(new Map<string, ResultTableState>());

  @observable.ref
  previewQueries = observable(new Map<string, string>());
  @observable.ref
  previewSelectedQueries = observable(new Map<string, { id: string; element: EventTarget & HTMLElement }>());

  @observable.ref
  sqlCopyState = observable(new Map<string, CopyState>());

  @observable
  sqlQueryPreviewHovered: boolean = false;
}

class ViewStateStore {
  @observable.ref
  private state = new State();

  @observable.ref
  sqlQueryLogFilter = new SqlQueryLogFilter();

  hoverTimeoutHandler?: number;

  constructor(root: RootStore) {}

  @computed
  get previewSelectedQueries() {
    return this.state.previewSelectedQueries;
  }

  @computed
  get sqlQueryPreviewHovered() {
    return this.state.sqlQueryPreviewHovered;
  }
  @action
  setSqlQueryPreviewHovered(hovered: boolean) {
    this.state.sqlQueryPreviewHovered = hovered;
  }

  sqlCopyState(sqlId: string): CopyState {
    return this.state.sqlCopyState.get(sqlId) || CopyState.Ready;
  }

  @action
  setSqlCopyState(sqlId: string, state: CopyState) {
    this.state.sqlCopyState.set(sqlId, state);
  }

  @action
  toggleSelectedQuery(scope: string, id: string, element: EventTarget & HTMLElement) {
    if (this.state.previewSelectedQueries.get(scope)?.id === id) {
      this.state.previewSelectedQueries.delete(scope);
    } else {
      this.state.previewSelectedQueries.set(scope, { id: id, element: element });
    }
  }
  @action
  setPreviewQuery(scope: string, id: string) {
    if (this.hoverTimeoutHandler) {
      clearTimeout(this.hoverTimeoutHandler);
    }
    this.state.previewQueries.set(scope, id);
  }

  @action
  cancelPreviewTimeout(scope: string, id: string) {
    if (this.state.previewQueries.get(scope) === id) {
      if (this.hoverTimeoutHandler) {
        clearTimeout(this.hoverTimeoutHandler);
      }
    }
  }

  @action
  unsetPreviewQuery(scope: string, id: string, delayed: boolean = true) {
    if (this.state.previewQueries.get(scope) !== id) {
      return;
    }

    if (delayed) {
      if (this.hoverTimeoutHandler) {
        clearTimeout(this.hoverTimeoutHandler);
      }
      this.hoverTimeoutHandler = setTimeout(() => {
        this.state.previewQueries.delete(scope);
        const selected = this.state.previewSelectedQueries.get(scope);
        if (selected) {
          selected.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 800) as any;
    } else {
      this.state.previewQueries.delete(scope);
      const selected = this.state.previewSelectedQueries.get(scope);
      if (selected) {
        selected.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }

  @computed
  get previewQueries() {
    return this.state.previewQueries;
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
    this.state.resultTable.delete(key);
  }

  @action cleanup() {
    clearTimeout(this.hoverTimeoutHandler);
    this.state = new State();
    this.sqlQueryLogFilter = new SqlQueryLogFilter();
  }
}

export default ViewStateStore;
