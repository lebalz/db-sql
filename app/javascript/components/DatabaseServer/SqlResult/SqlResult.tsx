import React from 'react';
import _ from 'lodash';
import { ErrorReport } from './ErrorReport';
import { ResultType } from '../../../api/db_server';
import { EmptyResult } from './EmptyResult';
import { SkippedResult } from './SkippedResult';
import ResultTable from './ResultTable';
import { TableData } from '../../../models/Query';

interface Props {
  result: TableData;
  queryIndex: number;
}

export const SqlResult = ({ result, queryIndex }: Props) => {
  switch (result.type) {
    case ResultType.Error:
      return <ErrorReport key={queryIndex} queryIndex={queryIndex} error={result.error} />;
    case ResultType.Success:
      if (result.result.length === 0) {
        return <EmptyResult queryIndex={queryIndex} key={queryIndex} />;
      }
      return <ResultTable table={result.result} key={queryIndex} />;
    case ResultType.Skipped:
      return <SkippedResult key={queryIndex} queryIndex={queryIndex} />;
  }
};
