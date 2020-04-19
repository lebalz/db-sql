import { action, observable, computed } from 'mobx';
import { rejectUndefined } from '../../utils/listFilters';
import { IGraph, GraphType } from './WordcloudGraph';

export default class LineGraph implements IGraph {
  readonly type = GraphType.LineGraph;
  readonly canFocus = true;

  @observable focused: 'xColumn' | 'yColumns' = 'yColumns';
  @observable focuseIndex: number = 0;

  @observable xColumn?: number;
  yColumns = observable<number>([]);

  @action
  onColumnSelection(columnIndex: number) {
    if (this.focused === 'xColumn') {
      if (this.xColumn === columnIndex) {
        this.xColumn = undefined;
      } else {
        this.xColumn = columnIndex;
      }
      return;
    }
    if (this.yColumns.length > this.focuseIndex) {
      this.yColumns[this.focuseIndex] = columnIndex;
    } else {
      this.yColumns.push(columnIndex);
    }
  }

  highlightColor(idx: number) {
    if (idx === this.xColumn) {
      return 'green';
    }
    if (this.yColumns.includes(idx)) {
      return 'blue';
    }
  }

  @computed
  get selectedColumns() {
    return rejectUndefined([this.xColumn, ...this.yColumns.slice().filter((idx) => idx >= 0)]);
  }
}
