import { Result as ApiResult, RawQueryResult, ResultTable as ResultTableData, ResultState } from '../api/db_server';

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

export default class Result<ResultData extends ApiResult> {
  data: ResultData;
  id: number;
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
}
