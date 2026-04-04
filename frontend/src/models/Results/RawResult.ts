import Result, { ResultType, TableData } from '../Result';
import { RawQueryResult, ResultState, SuccessQuery, ErrorQuery } from '../../api/db_server';

type RawResultType = SuccessQuery | ErrorQuery;

export default class RawResult extends Result<RawResultType> {
  get type(): ResultType {
    return ResultType.Raw;
  }

  get tableData(): TableData {
    if (this.data.state === ResultState.Error) {
      return this.data;
    }
    return {
      state: ResultState.Success,
      result: this.data.result
    };
  }
}
