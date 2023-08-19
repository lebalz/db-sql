import React from 'react';
import { Table, Placeholder, Label, Popup, Embed, Image, Card, Comment } from 'semantic-ui-react';
import _ from 'lodash';
import { ResultTable as ResulTableData } from '../../../api/db_server';
import { computed, action } from 'mobx';
import { observer, inject } from 'mobx-react';
import ViewStateStore from '../../../stores/view_state_store';
import cx from 'classnames';
import PreviewImage from './PreviewImage';

/**
 * show 200 rows at a time
 * e.g. for 20 rows per page:
 *  - initial: 0-200
 *  - position 180: set new range to 80-280
 *
 * Principle:
 *
 * initial Table:                                    with scroll:
 * ────────────────────────────────────────────────────────────────────
 *                                                  ===================
 *                                                       Top Spacer
 *                                                  ===================
 * ────────────────────────────────────────────────────────────────────
 * | Header | Other  |                              | Header | Other  |  ⎫
 * |--------|--------|                              |--------|--------|  ⎪
 * |        |        |             scrolling        |        |        |  ⎬ viewport
 * |     ......      |             ------->         |     ......      |  ⎪
 * |        |        |                              |        |        |  ⎭
 * ────────────────────────────────────────────────────────────────────
 * ===================                              ===================
 *                                                    Bottom Spacer
 *    Bottom Spacer                                 ===================
 *
 *
 * ==================
 * ────────────────────────────────────────────────────────────────────
 *
 * The reloading flicks a bit since the scrollposition changes and must
 * be reset to the current position.
 */
interface Props {
  table: ResulTableData;
  viewStateKey: string;
}

interface InjectedProps extends Props {
  viewStateStore: ViewStateStore;
}

export const DEFAULT_HEIGHT = 46;
const LOADED_ROWS = 200;
const THRESHOLD = 10;

@inject('viewStateStore')
@observer
class ResultTable extends React.Component<Props> {
  tableWrapper = React.createRef<HTMLTableRowElement>();

  @computed
  get injected() {
    return this.props as InjectedProps;
  }

  @computed
  get viewState() {
    return this.injected.viewStateStore.resultTableState(this.props.viewStateKey)!;
  }

  componentDidMount() {
    this.setInitialState();
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.table !== this.props.table) {
      this.setInitialState();
    }
  }

  @action
  setInitialState() {
    if (this.tableWrapper.current) {
      this.tableWrapper.current.scrollTo(0, 0);
      const firstRow = this.tableWrapper.current.querySelector('table tbody tr');
      if (firstRow) {
        this.injected.viewStateStore.resetScrollState(
          this.props.viewStateKey,
          firstRow.clientHeight,
          this.tableWrapper.current.clientHeight
        );
      }
    }
  }

  @computed
  get result() {
    return this.props.table;
  }
  @computed
  get headers() {
    if (this.result.length === 0) {
      return [];
    }
    return Object.keys(this.result[0]);
  }

  @computed
  get resultRange() {
    return this.result.slice(this.viewState.row, this.viewState.row + LOADED_ROWS);
  }

  @computed
  get spacerHeight() {
    const height = (this.result.length - LOADED_ROWS) * this.viewState.rowHeight;
    return height > 0 ? height : 0;
  }

  @computed
  get bottomSpacerHeight() {
    const height = (this.result.length - LOADED_ROWS - this.viewState.row) * this.viewState.rowHeight;
    return height > 0 ? height : 0;
  }

  lowerThreshold(dt: number = 0) {
    return _.sum(this.rowHeights.slice(0, THRESHOLD + dt));
  }

  upperThreshold(dt: number = 0) {
    return _.sum(this.rowHeights.slice(LOADED_ROWS - (THRESHOLD + dt)));
  }

  @computed
  get topSpacerHeight() {
    return this.viewState.row * this.viewState.rowHeight;
  }

  @computed
  get rowHeights(): number[] {
    if (!this.tableWrapper.current) {
      return [];
    }
    const rows = this.tableWrapper.current.querySelectorAll('table tbody tr');
    const heights: number[] = [];
    rows.forEach((row) => heights.push(row.clientHeight));
    return heights;
  }

  @computed
  get currentTableHeight(): number {
    return _.sum(this.rowHeights);
  }

  @computed
  get rowsPerPage() {
    return Math.ceil(this.viewState.wrapperHeight / this.viewState.rowHeight);
  }

  onScroll = (event: React.UIEvent<HTMLDivElement>) => {
    if (!this.tableWrapper.current) {
      event.preventDefault();
      return;
    }
    if (this.viewState.preventNextScrollUpdate) {
      event.preventDefault();
      this.tableWrapper.current.scrollTo(this.viewState.x, this.viewState.y);
      this.viewState.preventNextScrollUpdate = false;
      return;
    }
    const table = this.tableWrapper.current.querySelector('table');
    if (!table) {
      return;
    }
    const height = table.clientHeight + this.spacerHeight;
    const { scrollTop } = event.currentTarget;
    const row = Math.floor(scrollTop / (height / this.result.length));

    const isInBounds = row < this.result.length && row >= 0;
    const needsUpperExtend =
      scrollTop >
      this.viewState.row * this.viewState.rowHeight + this.currentTableHeight - this.upperThreshold();

    const needsLowestExtend = scrollTop < this.viewState.row * this.viewState.rowHeight;
    const needsLowerExtend =
      scrollTop > this.lowerThreshold() &&
      scrollTop < this.viewState.row * this.viewState.rowHeight + this.lowerThreshold();

    if (isInBounds && (needsUpperExtend || needsLowestExtend || needsLowerExtend)) {
      event.preventDefault();
      const newRow = row - LOADED_ROWS / 2;
      let dt = 0;
      if (needsUpperExtend) {
        dt = this.upperThreshold(-1);
      } else if (needsLowerExtend) {
        dt = -this.lowerThreshold(-1);
      }
      this.viewState.row = newRow < 0 ? 0 : newRow;
      this.viewState.preventNextScrollUpdate = true;
      this.viewState.x = event.currentTarget.scrollLeft;
      this.viewState.y = scrollTop - dt;
    }
  };

  @action
  onColumnClick(index: number) {
    if (!this.viewState.graph) {
      return;
    }
    this.viewState.graph.onColumnSelection(index);
  }

  render() {
    const selectedColumns = this.viewState.graph?.selectedColumns || [];
    const selectionMap = this.headers.map((_, idx) => selectedColumns.includes(idx));
    const colorMap = this.headers.map((_, idx) => this.viewState.graph?.highlightColor(idx));
    return (
      <div className="sql-result-table" onScroll={this.onScroll} ref={this.tableWrapper}>
        <ScrollPlaceholder height={this.topSpacerHeight} />
        <Table
          celled
          style={{
            paddingLeft: 0,
            paddingRight: 0
          }}
        >
          <Table.Header>
            <Table.Row>
              {this.headers.map((key, i) => {
                return (
                  <Table.HeaderCell
                    key={i}
                    className={cx(colorMap[i], {
                      'selectable-column': this.viewState.graph?.canFocus,
                      selected: selectionMap[i]
                    })}
                    onClick={() => this.onColumnClick(i)}
                  >
                    {key}
                  </Table.HeaderCell>
                );
              })}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {this.resultRange.map((val, i) => {
              return (
                <Table.Row key={i}>
                  {Object.values(val).map((cell, j) => {
                    return (
                      <Table.Cell 
                        key={j} 
                        className={cx(colorMap[j], { selected: selectionMap[j] })}
                        style={{
                          maxWidth: '30em',
                          overflow: 'auto',
                          verticalAlign: 'text-top'
                        }}
                      >
                        <CellContent cell={cell} />
                      </Table.Cell>
                    );
                  })}
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table>
        <ScrollPlaceholder height={this.bottomSpacerHeight} />
      </div>
    );
  }
}

const CellContent = ({ cell }: { cell: number | string | undefined | null }) => {
  switch (typeof cell) {
    case 'string':
      if (cell === '') {
        return <span>-</span>;
      }
      if (/^https?:\/\/.*/.test(cell)) {
        if (/\.(jpeg|jpg|gif|png|gif|svg|bpm|webp)$/i.test(cell)) {
          return (
            <Comment.Group className='img-comments'>
              <Comment>
                <Comment.Avatar as='a' src={cell} className='comment-avatar-mini' />
                <Comment.Content>
                  <Comment.Text>{<a href={cell} target="_blank">{cell}</a>}</Comment.Text>
                  <Comment.Metadata className='comment-metadata'>{cell.split('/').pop()}</Comment.Metadata>
                </Comment.Content>
              </Comment>
            </Comment.Group>
          );
        }
        return (
          <span>
            <Popup trigger={<a href={cell} target="_blank">{cell}</a>} flowing hoverable>
              <PreviewImage url={cell} />
            </Popup>
          </span>
        )
      }
      let json: string | undefined;
      if (/^\{|\[/.test(cell)) {
        try {
          json = JSON.parse(cell);
        } catch {
          if (/\{.*\}/.test(cell)) {
            try {
              json = JSON.parse(cell.replace(/\{(.*)\}/, '\[$1\]').replace(/"{/g, '{').replace(/}"/g, '}').replace(/\\"/g, '"'));
            } catch {}
          }
        }
      }
      if (json) {
        return (
          <span>
            <pre>
              <code>{JSON.stringify(json, undefined, 1).replace(/\\\\?n/g, "\n")}</code>
            </pre>
          </span>
        );
      }
      return <span>{cell}</span>;
    case 'number':
      return <span>{cell}</span>;
    case 'boolean':
      return <span>{(cell as boolean).toString()}</span>;
  }
  if (cell) {
    return <span>{cell}</span>;
  }
  return <Label content="NULL" size="mini" />;
};

const ScrollPlaceholder = ({ height }: { height: number }) => {
  return (
    <Placeholder className="scroll-spacer" style={{ height: `${height}px` }}>
      <Placeholder.Header>
        <Placeholder.Line />
      </Placeholder.Header>
    </Placeholder>
  );
};

export default ResultTable;
