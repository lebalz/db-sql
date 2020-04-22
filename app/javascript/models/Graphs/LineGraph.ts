import { action, observable, computed } from 'mobx';
import { rejectUndefined } from '../../utils/listFilters';
import { IGraph, GraphType } from './WordcloudGraph';
import { SEMANTIC_HEX_COLORS } from '../../utils/colors';

export default class LineGraph implements IGraph {
  readonly type = GraphType.LineGraph;
  readonly canFocus = true;

  @observable focused: 'xColumn' | 'yColumns' = 'yColumns';
  @observable focuseIndex: number = 0;

  @observable xColumn?: number;
  yColumns = observable<number>([]);
  @observable
  colors = observable<string>([]);

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
      this.colors.push(SEMANTIC_HEX_COLORS[columnIndex % SEMANTIC_HEX_COLORS.length]);
    }
  }

  highlightColor(idx: number) {
    if (idx === this.xColumn) {
      return 'blue';
    }
    if (this.yColumns.includes(idx)) {
      return 'green';
    }
  }

  @computed
  get selectedColumns() {
    return rejectUndefined([this.xColumn, ...this.yColumns.slice().filter((idx) => idx >= 0)]);
  }
}
