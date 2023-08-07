import React, { Fragment } from 'react';
import { Segment, Label, Popup, Header, Accordion } from 'semantic-ui-react';
import _ from 'lodash';
import { ResultState } from '../../api/db_server';
import { computed, action } from 'mobx';
import QueryEditor from '../../models/QueryEditor';
import { inject, observer } from 'mobx-react';
import ViewStateStore from '../../stores/view_state_store';
import { TableData } from '../../models/Result';
import ResultPanelHeader from './ResultPanel/ResultPanelHeader';
import ResultPanelBody from './ResultPanel/ResultPanelBody';

interface Props {
  query: QueryEditor;
}

interface InjectedProps extends Props {
  viewStateStore: ViewStateStore;
}

@inject('viewStateStore')
@observer
class ResultIndex extends React.Component<Props> {
  get results() {
    return this.props.query.resultTableData;
  }

  @computed
  get injected() {
    return this.props as InjectedProps;
  }

  viewState(idx: number) {
    return this.injected.viewStateStore.resultTableState(`${this.props.query.name}#${idx}`);
  }

  @computed
  get queries() {
    return this.props.query.queries;
  }

  @computed
  get errors() {
    return this.results.filter((r) => r.state === ResultState.Error);
  }

  @computed
  get succeeded() {
    return this.results.filter((r) => r.state === ResultState.Success);
  }

  @action
  onShowGraph(event: React.MouseEvent<HTMLElement, MouseEvent>, idx: number) {
    event.preventDefault();
    event.stopPropagation();
    this.viewState(idx).showGraph = !this.viewState(idx).showGraph;
  }

  get resultPanels() {
    return this.props.query.results.map((result, idx) => {
      return {
        key: idx,
        title: {
          content: (
            <ResultPanelHeader
              index={idx}
              queryName={this.props.query.name}
              disabled={this.queries.length === 0}
              rawQuery={this.queries.length > idx ? this.queries[idx] : ''}
              result={result}
            />
          )
        },
        content: {
          content: <ResultPanelBody index={idx} queryName={this.props.query.name} result={result} />
        }
      };
    });
  }

  render() {
    if (this.results.length === 0) {
      return null;
    }

    const totalTime = this.props.query.queryExecutionTime;

    return (
      <Fragment>
        <Header as="h5" attached="top" className="results-header">
          Result
          <Popup content={`${totalTime}s`} trigger={<Label color="blue">{totalTime.toFixed(2)}s</Label>} />
          {this.errors.length > 0 ? (
            <Popup
              content={`Errors: ${this.errors.length}`}
              trigger={
                <Label color="orange">{`${this.succeeded.length}/${this.results.length} successful`}</Label>
              }
            />
          ) : (
            <Popup
              content={'Executed all queries successfully'}
              trigger={<Label color="green">{`Queries: ${this.results.length}`}</Label>}
            />
          )}
        </Header>
        <Segment attached style={{ padding: 0 }}>
          <Accordion
            styled
            fluid
            exclusive={false}
            panels={this.resultPanels}
            className="sql-results"
            defaultActiveIndex={[...Array(50).keys()]}
          />
        </Segment>
      </Fragment>
    );
  }
}

export default ResultIndex;
