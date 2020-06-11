import React from 'react';
import _ from 'lodash';
import { ErrorReport } from './ErrorReport';
import { ResultState } from '../../../api/db_server';
import { EmptyResult } from './EmptyResult';
import { SkippedResult } from './SkippedResult';
import ResultTable from './ResultTable';
import { TableData } from '../../../models/Result';

interface Props {
  result: TableData;
  queryIndex: number;
  viewStateKey: string;
}

export const SqlResult = ({ result, queryIndex, viewStateKey }: Props) => {
  switch (result.state) {
    case ResultState.Error:
      return <ErrorReport key={queryIndex} queryIndex={queryIndex} error={result.error} />;
    case ResultState.Success:
      if (result.result.length === 0) {
        return <EmptyResult queryIndex={queryIndex} key={queryIndex} />;
      }
      return <ResultTable table={result.result} viewStateKey={viewStateKey} key={queryIndex} />;
    case ResultState.Skipped:
      return <SkippedResult key={queryIndex} queryIndex={queryIndex} />;
  }
};
