import React from 'react';
import _ from 'lodash';
import { ErrorReport } from './ErrorReport';
import { ResultType, QueryResult } from '../../../api/db_server';
import { EmptyResult } from './EmptyResult';
import ResultTable from './ResultTable';

interface Props {
  queryIndex: number;
  result: QueryResult;
}

export const SqlResult = ({ result, queryIndex }: Props) => {
  if (result.type === ResultType.Error) {
    return <ErrorReport key={queryIndex} queryIndex={queryIndex} error={result.error} />;
  }
  if (result.result.length === 0) {
    return <EmptyResult queryIndex={queryIndex} key={queryIndex} />;
  }
  return <ResultTable table={result.result} key={queryIndex} />;
};
