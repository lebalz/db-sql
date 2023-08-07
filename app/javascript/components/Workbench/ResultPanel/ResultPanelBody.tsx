import { action, computed } from 'mobx';
import { inject, observer } from 'mobx-react';
import React, { Fragment } from 'react';
import { ResultState } from '../../../api/db_server';
import { QueryResult } from '../../../models/QueryEditor';
import ViewStateStore from '../../../stores/view_state_store';
import Graph from '../SqlResult/Graph';
import { SqlResult } from '../SqlResult/SqlResult';
import { SuccessTableData } from '../../../models/Result';

interface Props {
  index: number;
  queryName: string;
  result: QueryResult;
}

interface InjectedProps extends Props {
  viewStateStore: ViewStateStore;
}

@inject('viewStateStore')
@observer
export default class ResultPanelBody extends React.Component<Props> {
  @computed
  get injected() {
    return this.props as InjectedProps;
  }

  @computed
  get viewState() {
    return this.injected.viewStateStore.resultTableState(`${this.props.queryName}#${this.props.index}`);
  }

  render() {
    const result = this.props.result;
    const idx = this.props.index;
    const resultId = `${this.props.queryName}#${idx}`;

    return (
      <Fragment>
        {result.data.state === ResultState.Success && this.viewState.showGraph && (
          <Graph data={result.data as SuccessTableData} id={resultId} />
        )}
        <SqlResult result={result} viewStateKey={resultId} queryIndex={idx} key={idx} />
      </Fragment>
    );
  }
}
