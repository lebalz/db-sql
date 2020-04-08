import React from 'react';
import { Table, Placeholder } from 'semantic-ui-react';
import _ from 'lodash';
import { ResultTable as ResulTableType } from '../../../api/db_server';
import { computed } from 'mobx';

interface Props {
  table: ResulTableType;
}

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

const DEFAULT_HEIGHT = 46;
const LOADED_ROWS = 200;
const THRESHOLD = 10;

export default class ResultTable extends React.Component<Props> {
  tableWrapper = React.createRef<HTMLTableRowElement>();

  state = {
    row: 0,
    rowHeight: DEFAULT_HEIGHT,
    wrapperHeight: DEFAULT_HEIGHT * 20,
    preventNextScrollUpdate: false,
    x: 0,
    y: 0
  };

  componentDidMount() {
    this.setInitialState();
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.table !== this.props.table) {
      this.setInitialState();
    }
  }

  setInitialState() {
    if (this.tableWrapper.current) {
      this.tableWrapper.current.scrollTo(0, 0);
      const firstRow = this.tableWrapper.current.querySelector('table tbody tr');
      if (firstRow) {
        this.setState({
          rowHeight: firstRow.clientHeight,
          wrapperHeight: this.tableWrapper.current.clientHeight,
          x: 0,
          y: 0
        });
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
    return this.result.slice(this.state.row, this.state.row + LOADED_ROWS);
  }

  @computed
  get spacerHeight() {
    const height = (this.result.length - LOADED_ROWS) * this.state.rowHeight;
    return height > 0 ? height : 0;
  }

  @computed
  get bottomSpacerHeight() {
    const height = (this.result.length - LOADED_ROWS - this.state.row) * this.state.rowHeight;
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
    return this.state.row * this.state.rowHeight;
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
    return Math.ceil(this.state.wrapperHeight / this.state.rowHeight);
  }

  onScroll = (event: React.UIEvent<HTMLDivElement>) => {
    if (!this.tableWrapper.current) {
      event.preventDefault();
      return;
    }
    if (this.state.preventNextScrollUpdate) {
      event.preventDefault();
      this.tableWrapper.current.scrollTo(this.state.x, this.state.y);
      this.setState({ preventNextScrollUpdate: false });
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
      scrollTop > this.state.row * this.state.rowHeight + this.currentTableHeight - this.upperThreshold();

    const needsLowestExtend = scrollTop < this.state.row * this.state.rowHeight;
    const needsLowerExtend =
      scrollTop > this.lowerThreshold() &&
      scrollTop < this.state.row * this.state.rowHeight + this.lowerThreshold();

    if (isInBounds && (needsUpperExtend || needsLowestExtend || needsLowerExtend)) {
      event.preventDefault();
      const newRow = row - LOADED_ROWS / 2;
      let dt = 0;
      if (needsUpperExtend) {
        dt = this.upperThreshold(-1);
      } else if (needsLowerExtend) {
        dt = -this.lowerThreshold(-1);
      }
      this.setState({
        row: newRow < 0 ? 0 : newRow,
        preventNextScrollUpdate: true,
        x: event.currentTarget.scrollLeft,
        y: scrollTop - dt
      });
    }
  };

  render() {
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
                return <Table.HeaderCell key={i}>{key}</Table.HeaderCell>;
              })}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {this.resultRange.map((val, i) => {
              return (
                <Table.Row key={i}>
                  {Object.values(val).map((ds, j) => {
                    return <Table.Cell key={j}>{ds}</Table.Cell>;
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

const ScrollPlaceholder = ({ height }: { height: number }) => {
  return (
    <Placeholder className="scroll-spacer" style={{ height: `${height}px` }}>
      <Placeholder.Header>
        <Placeholder.Line />
      </Placeholder.Header>
    </Placeholder>
  );
};
