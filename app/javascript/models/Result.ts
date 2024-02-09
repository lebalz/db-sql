import { Result as ApiResult, ResultTable as ResultTableData, ResultState } from '../api/db_server';
import { observable, action, computed } from 'mobx';

export enum ResultType {
  Multi = 'multi_query',
  Raw = 'raw_query'
}

interface SqlTableData {
  state: ResultState;
  time?: number;
}

export interface SuccessTableData extends SqlTableData {
  state: ResultState.Success;
  result: ResultTableData;
}

interface ErrorTableData extends SqlTableData {
  state: ResultState.Error;
  error: string;
}

interface SkipTableData extends SqlTableData {
  state: ResultState.Skipped;
}

export type TableData = SuccessTableData | ErrorTableData | SkipTableData;

export enum CopyState {
  Ready,
  Copying,
  Error,
  Success
}

/**
 * @example for headers: ['hello', 'foo', 'baz'], maxChars: [8, 6, 3] and types: ['string', 'number', 'string']
 *  it returns
 * 
 *    | hello    |    foo | baz |
 *    |:---------|-------:|:----|
 */
const markdownHeader = (headers: string[], maxChars: number[], types: ('number' | 'string')[]): string => {
  let mdHeader = '';
  /* fill in the column names */
  headers.forEach((val, idx) => {
    if (types[idx] === 'number') {
      mdHeader += `| ${val.padStart(maxChars[idx], ' ')} `;
    } else {
      mdHeader += `| ${val.padEnd(maxChars[idx], ' ')} `;
    }
  });
  mdHeader += '|\n';

  /* insert the markdown table descriptor */
  headers.forEach((_, idx) => {
    if (types[idx] === 'number') {
      mdHeader += `|-${''.padEnd(maxChars[idx], '-')}:`;
    } else {
      mdHeader += `|:${''.padEnd(maxChars[idx], '-')}-`;
    }
  });
  mdHeader += '|\n';

  return mdHeader;
};

/**
 * @example for headers: ['hello', 'foo', 'baz'], maxChars: [8, 6, 3] and types: ['string', 'number', 'string']
 *  it returns
 * 
 *     hello  |  foo  |  baz   
 *    --------+-------+--------
 */
const sqlHeader = (headers: string[], maxChars: number[], types: ('number' | 'string')[]): string => {
  let sqlHeader = '';
  /* fill in the column names */
  headers.forEach((val, idx) => {
    if (idx > 0) {
      sqlHeader += '|';
    }
    sqlHeader += ` ${val.padStart(Math.floor(maxChars[idx] / 2), ' ').padEnd(maxChars[idx], ' ')} `;
  });
  sqlHeader += '\n';

  /* insert the sql header divider */
  headers.forEach((_, idx) => {
    if (idx > 0) {
      sqlHeader += '+-';
    } else {
      sqlHeader += '-';
    }
    sqlHeader += `${''.padEnd(maxChars[idx], '-')}-`;
  });
  sqlHeader += '\n';
  return sqlHeader;
};

class Result<ResultData extends ApiResult> {
  data: ResultData;
  id: number;
  @observable copyState: CopyState = CopyState.Ready;
  @observable displayMode: 'table' | 'sql' | 'markdown' | 'json' = 'table';

  constructor(data: ResultData, id: number) {
    this.data = data;
    this.id = id;
  }

  get type(): ResultType {
    throw 'Not implemented';
  }

  get state(): ResultState {
    return this.data.state;
  }

  get tableData(): TableData {
    throw 'Not implemented';
  }

  get time() {
    return this.data.time;
  }

  get limitReached() {
    return !!this.data.limit_reached;
  }

  get headers(): string[] | undefined {
    if (!this.result || this.result.length === 0) {
      return;
    }
    return Object.keys(this.result[0]);
  }

  get result() {
    if (this.tableData.state !== ResultState.Success) {
      return;
    }
    return this.tableData.result;
  }

  @computed
  get resultString() {
    if (this.displayMode === 'table') {
      return this.sqlString;
    }
    switch (this.displayMode) {
      case 'sql':
        return this.sqlString;
      case 'markdown':
        return this.mdString;
      case 'json':
        return this.jsonString;
    }
  }

  @action
  setDisplayMode(mode: 'table' | 'sql' | 'markdown' | 'json') {
    this.displayMode = mode;
  }

  @action
  onCopy(success: boolean) {
    if (success) {
      this.copyState = CopyState.Success;
    } else {
      this.copyState = CopyState.Error;
    }
    const before = this.copyState;
    setTimeout(() => {
      if (this.copyState === before) {
        this.copyState = CopyState.Ready;
      }
    }, 2000);
  }

  get sqlString() {
    if (this.tableData.state === ResultState.Error) {
      return this.tableData.error;
    }
    if (this.tableData.state === ResultState.Skipped) {
      return 'No result, execution skipped';
    }
    const headerCount = this.headers?.length;
    if (!this.result || !this.headers || !headerCount || this.result.length === 0) {
      return 'Successful query execution without result data';
    }

    /* one additional row for the header */
    const rowCount = this.result.length + 1;
    const columns = this.headers.map((c) => [c]);

    /* column based representaition */
    this.result.forEach((row) => {
      Object.values(row).forEach((val, idx) => {
        columns[idx].push((val ?? '').toString());
      });
    });

    /* get the maximal character count of each column  */
    const maxChars = columns.map((col) => Math.max(...col.map((val) => val.length)));

    /* distinguish between text and numbers to align the values left or right sided */
    const types = Object.values(this.result[0] ?? {}).map((val) =>
      typeof val === 'number' ? 'number' : 'string'
    );

    let sqlTable = sqlHeader(this.headers, maxChars, types);

    /* fill in the table data */
    for (let i = 1; i < rowCount; i++) {
      for (let j = 0; j < headerCount; j++) {
        if (j > 0) {
          sqlTable += '|';
        }
        if (types[j] === 'number') {
          sqlTable += ` ${columns[j][i].padStart(maxChars[j], ' ')} `;
        } else {
          sqlTable += ` ${columns[j][i].padEnd(maxChars[j], ' ')} `;
        }
      }
      sqlTable += '\n';
    }
    return sqlTable;
  }

  get mdString() {
    /* return message when no result table is present*/
    if (this.tableData.state === ResultState.Error) {
      return this.tableData.error;
    }
    if (this.tableData.state === ResultState.Skipped) {
      return 'No result, execution skipped';
    }
    const headerCount = this.headers?.length;
    if (!this.result || !this.headers || !headerCount || this.result.length === 0) {
      return 'Successful query execution without result data';
    }

    /* one additional row for the header */
    const rowCount = this.result.length + 1;
    const columns = this.headers.map((c) => [c]);

    /* column based representaition */
    this.result.forEach((row) => {
      Object.values(row).forEach((val, idx) => {
        columns[idx].push((val ?? '').toString());
      });
    });

    /* get the maximal character count of each column  */
    const maxChars = columns.map((col) => Math.max(...col.map((val) => val.length)));

    /* distinguish between text and numbers to align the values left or right sided */
    const types = Object.values(this.result[0] ?? {}).map((val) =>
      typeof val === 'number' ? 'number' : 'string'
    );

    let mdTable = markdownHeader(this.headers, maxChars, types);

    /* fill in the table data */
    for (let i = 1; i < rowCount; i++) {
      for (let j = 0; j < headerCount; j++) {
        if (types[j] === 'number') {
          mdTable += `| ${columns[j][i].padStart(maxChars[j], ' ')} `;
        } else {
          mdTable += `| ${columns[j][i].padEnd(maxChars[j], ' ')} `;
        }
      }
      mdTable += '|\n';
    }
    return mdTable;
  }

  get jsonString() {
    if (this.tableData.state === ResultState.Error) {
      return this.tableData.error;
    }
    if (this.tableData.state === ResultState.Skipped) {
      return 'No result, execution skipped';
    }
    if (!this.result || this.result.length === 0) {
      return 'Successful query execution without result data';
    }
    return JSON.stringify(this.result, null, 2);
  }
}

export default Result;
