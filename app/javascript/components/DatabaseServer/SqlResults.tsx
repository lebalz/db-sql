import React, { Fragment } from 'react';
import { Segment, Label, Popup, Header, Accordion, Button, Icon } from 'semantic-ui-react';
import _ from 'lodash';
import { ResultType } from '../../api/db_server';
import { computed, action } from 'mobx';
import { SqlResult } from './SqlResult/SqlResult';
import Query, { TableData } from '../../models/Query';
import { SemanticCOLORS } from 'semantic-ui-react/dist/commonjs/generic';
import Tooltip from '../../shared/Tooltip';
import { PrismCode } from './SqlResult/PrismCode';
import { inject, observer } from 'mobx-react';
import ViewStateStore from '../../stores/view_state_store';
import Graph from './SqlResult/Graph';

interface Props {
  query: Query;
}

interface InjectedProps extends Props {
  viewStateStore: ViewStateStore;
}

const labelColor = (result: TableData): SemanticCOLORS => {
  switch (result.type) {
    case ResultType.Error:
      return 'red';
    case ResultType.Skipped:
      return 'yellow';
    case ResultType.Success:
      return 'green';
  }
};

@inject('viewStateStore')
@observer
class SqlResults extends React.Component<Props> {
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
    return this.results.filter((r) => r.type === ResultType.Error);
  }

  @computed
  get succeeded() {
    return this.results.filter((r) => r.type === ResultType.Success);
  }

  @action
  onShowGraph(event: React.MouseEvent<HTMLElement, MouseEvent>, idx: number) {
    event.preventDefault();
    event.stopPropagation();
    this.viewState(idx).showGraph = !this.viewState(idx).showGraph;
  }

  get resultPanels() {
    return this.props.query.resultTableData.map((result, idx) => {
      const resultId = `${this.props.query.name}#${idx}`;
      return {
        key: idx,
        title: {
          content: (
            <Fragment>
              <Tooltip
                content={
                  <PrismCode
                    code={this.queries.length > idx ? this.queries[idx] : ''}
                    language="sql"
                    plugins={['line-numbers']}
                  />
                }
                disabled={this.queries.length === 0}
              >
                <Label
                  size="large"
                  color={labelColor(result)}
                  content={`Query #${idx + 1}`}
                  style={{ marginRight: '1em', color: 'black' }}
                />
              </Tooltip>
              {<TimeLabel result={result} />}
              <div className="spacer" />
              {result.type === ResultType.Success && (
                <Tooltip content="Show graph">
                  <Button
                    size="mini"
                    active={this.viewState(idx).showGraph}
                    icon={
                      <Icon.Group>
                        <Icon name="area graph" color="blue" />
                      </Icon.Group>
                    }
                    onClick={(e) => this.onShowGraph(e, idx)}
                  />
                </Tooltip>
              )}
            </Fragment>
          )
        },
        content: {
          content: (
            <Fragment>
              {result.type === ResultType.Success && this.viewState(idx).showGraph && (
                <Graph data={result} id={resultId} />
              )}
              <SqlResult result={result} viewStateKey={resultId} queryIndex={idx} key={idx} />
            </Fragment>
          )
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

export const TimeLabel = ({ result }: { result: TableData }) => {
  const { time } = result;
  if (time === undefined) {
    return null;
  }

  let popup: string;
  let label: string;
  switch (result.type) {
    case ResultType.Error:
      popup = `Time: ${time}s`;
      label = `${time.toFixed(2)}s`;
      break;
    case ResultType.Success:
      popup = `Time: ${time}s`;
      label = `${result.result.length} in ${time.toFixed(2)}s`;
      break;
    case ResultType.Skipped:
      popup = `Time: ${time}s`;
      label = `${time.toFixed(2)}s`;
      break;
  }
  return <Popup content={popup} trigger={<Label as="a" tag color="blue" content={label} />} />;
};

export default SqlResults;
