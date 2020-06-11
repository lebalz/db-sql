import Result, { ResultType, TableData } from "../Result";
import { MultiQueryResult } from "../../api/db_server";



export default class MultiResult extends Result<MultiQueryResult> {
  get type(): ResultType {
    return ResultType.Multi;
  }

  get tableData(): TableData {
    return this.data;
  }
}