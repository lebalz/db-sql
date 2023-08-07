import React from 'react';
import _ from 'lodash';
import { ErrorReport } from './ErrorReport';
import { ResultState } from '../../../api/db_server';
import { EmptyResult } from './EmptyResult';
import { SkippedResult } from './SkippedResult';
import ResultTable from './ResultTable';
import { TableData } from '../../../models/Result';
import { observer } from 'mobx-react';
import { QueryResult } from '../../../models/QueryEditor';
import { PrismCode } from './PrismCode';

interface Props {
  result: QueryResult;
  queryIndex: number;
  viewStateKey: string;
}

export const SqlResult = observer(({ result, queryIndex, viewStateKey }: Props) => {
  switch (result.tableData.state) {
    case ResultState.Error:
      return <ErrorReport key={queryIndex} queryIndex={queryIndex} error={result.tableData.error} />;
    case ResultState.Success:
      if (result.tableData.result.length === 0) {
        return <EmptyResult queryIndex={queryIndex} key={queryIndex} />;
      }
      console.log('dm', result)
      switch (result.displayMode) {
        case 'table':
          return <ResultTable table={result.tableData.result} viewStateKey={viewStateKey} key={queryIndex} />;
        case 'sql':
        case 'markdown':
        case 'json':
          return (
            <PrismCode 
              code={result.resultString}
              language={result.displayMode === 'sql' ? 'any' : result.displayMode}
              style={{ maxHeight: '64em', fontSize: 'smaller' }}
            />
          );
        default:
          return <ResultTable table={result.tableData.result} viewStateKey={viewStateKey} key={queryIndex} />;
      }
    case ResultState.Skipped:
      return <SkippedResult key={queryIndex} queryIndex={queryIndex} />;
  }
});
