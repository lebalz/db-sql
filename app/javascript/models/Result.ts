import { Result as ApiResult, ResultTable as ResultTableData, ResultState } from '../api/db_server';
import { observer } from 'mobx-react';
import { observable, action, reaction } from 'mobx';

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

class Result<ResultData extends ApiResult> {
  data: ResultData;
  id: number;
  @observable copyState: CopyState = CopyState.Ready;
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

  get markdownTable() {
    if (this.tableData.state === ResultState.Error) {
      return this.tableData.error;
    }
    if (this.tableData.state === ResultState.Skipped) {
      return 'No result, execution skipped';
    }
    const headerCount = this.headers?.length;
    if (!this.result || !headerCount || this.result.length === 0) {
      return 'Successful query execution without result data';
    }

    const rowCount = this.result.length + 1;
    const columns = this.headers!.map((c) => [c]);
    this.result.forEach((row) => {
      Object.values(row).forEach((val, idx) => {
        columns[idx].push((val ?? '').toString());
      });
    });
    let mdTable = '';
    const maxChars = columns.map((col) => Math.max(...col.map((val) => val.length)));
    const types =
      this.result.length === 0
        ? []
        : Object.values(this.result[0]).map((val) => (typeof val === 'number' ? 'number' : 'string'));
    for (let i = 0; i < rowCount; i++) {
      for (let j = 0; j < headerCount; j++) {
        if (types[j] === 'number') {
          mdTable += `| ${columns[j][i].padStart(maxChars[j], ' ')} `;
        } else {
          mdTable += `| ${columns[j][i].padEnd(maxChars[j], ' ')} `;
        }
      }
      mdTable += '|\n';
      if (i === 0) {
        for (let j = 0; j < headerCount; j++) {
          if (types[j] === 'number') {
            mdTable += `|-${''.padEnd(maxChars[j], '-')}:`;
          } else {
            mdTable += `|:${''.padEnd(maxChars[j], '-')}-`;
          }
        }
        mdTable += '|\n';
      }
    }
    return mdTable;
  }
}

export default Result;
