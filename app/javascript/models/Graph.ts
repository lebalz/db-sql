import { action, observable, computed } from 'mobx';
import { rejectUndefined } from '../utils/listFilters';

export enum GraphType {
  WordCloud,
  LineGraph,
  None
}

export type Graph = WordcloudGraph;

export interface IGraph {
  readonly type: GraphType;
  canFocus: boolean;
  onColumnSelection: (columnIndex: number) => any;
  highlightColor: (columnIndex: number) => 'green' | 'blue' | undefined;
  selectedColumns: number[];
}

class WordcloudGraph implements IGraph {
  readonly type = GraphType.WordCloud;
  readonly canFocus = true;

  @observable
  focused: 'wordColumn' | 'countColumn' = 'wordColumn';

  @observable wordColumn?: number;
  @observable countColumn?: number;
  @observable minFontSize: number = -1;
  @observable maxFontSize: number = -1;

  @action
  onColumnSelection(columnIndex: number) {
    if (this.focused === 'wordColumn') {
      if (this.wordColumn === columnIndex) {
        this.wordColumn = undefined;
      } else {
        this.wordColumn = columnIndex;
      }
      return;
    }
    if (this.countColumn === columnIndex) {
      this.countColumn = undefined;
    } else {
      this.countColumn = columnIndex;
    }

  }

  highlightColor(idx: number) {
    if (idx === this.wordColumn) {
      return 'green';
    }
    if (idx === this.countColumn) {
      return 'blue';
    }
  }

  @computed
  get selectedColumns() {
    return rejectUndefined([this.wordColumn, this.countColumn]);
  }
}

export { WordcloudGraph };
