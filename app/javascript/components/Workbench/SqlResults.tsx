import React, { Fragment } from 'react';
import { Segment, Label, Popup, Header, Accordion, Button, Icon } from 'semantic-ui-react';
import _ from 'lodash';
import { ResultState } from '../../api/db_server';
import { computed, action } from 'mobx';
import { SqlResult } from './SqlResult/SqlResult';
import QueryEditor from '../../models/QueryEditor';
import { SemanticCOLORS, SemanticICONS } from 'semantic-ui-react/dist/commonjs/generic';
import Tooltip from '../../shared/Tooltip';
import { PrismCode } from './SqlResult/PrismCode';
import { inject, observer } from 'mobx-react';
import ViewStateStore from '../../stores/view_state_store';
import Graph from './SqlResult/Graph';
import { TableData, CopyState } from '../../models/Result';
import CopyToClipboard from 'react-copy-to-clipboard';

interface Props {
  query: QueryEditor;
}

interface InjectedProps extends Props {
  viewStateStore: ViewStateStore;
}

const labelColor = (result: TableData): SemanticCOLORS => {
  switch (result.state) {
    case ResultState.Error:
      return 'red';
    case ResultState.Skipped:
      return 'yellow';
    case ResultState.Success:
      return 'green';
  }
};

const copyIconColor = (state: CopyState): SemanticCOLORS | undefined => {
  switch (state) {
    case CopyState.Error:
      return 'red';
    case CopyState.Success:
      return 'green';
    case CopyState.Ready:
      return;
    case CopyState.Copying:
      return 'blue';
  }
};

const copyIcon = (state: CopyState): SemanticICONS => {
  switch (state) {
    case CopyState.Error:
      return 'close';
    case CopyState.Success:
      return 'check';
    case CopyState.Ready:
      return 'copy';
    case CopyState.Copying:
      return 'copy';
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
                  color={labelColor(result.data)}
                  content={`Query #${idx + 1}`}
                  style={{ marginRight: '1em', color: 'black' }}
                />
              </Tooltip>
              {<TimeLabel result={result.data} />}
              <div className="spacer" />
              <Fragment>
                <Tooltip content="Copy Results as Markdown table" position="top right" delayed>
                  <CopyToClipboard
                    text={result.markdownTable}
                    onCopy={(_, success) => result.onCopy(success)}
                  >
                    <Button
                      size="mini"
                      loading={result.copyState === CopyState.Copying}
                      icon={
                        <Icon.Group>
                          <Icon name={copyIcon(result.copyState)} color={copyIconColor(result.copyState)} />
                        </Icon.Group>
                      }
                      onClick={(e) => e.stopPropagation()}
                    />
                  </CopyToClipboard>
                </Tooltip>
                {result.state === ResultState.Success && (
                  <Tooltip content="Show graph" position="top right" delayed>
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
            </Fragment>
          )
        },
        content: {
          content: (
            <Fragment>
              {result.data.state === ResultState.Success && this.viewState(idx).showGraph && (
                <Graph data={result.data} id={resultId} />
              )}
              <SqlResult result={result.data} viewStateKey={resultId} queryIndex={idx} key={idx} />
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
  switch (result.state) {
    case ResultState.Error:
      popup = `Time: ${time}s`;
      label = `${time.toFixed(2)}s`;
      break;
    case ResultState.Success:
      popup = `Time: ${time}s`;
      label = `${result.result.length} in ${time.toFixed(2)}s`;
      break;
    case ResultState.Skipped:
      popup = `Time: ${time}s`;
      label = `${time.toFixed(2)}s`;
      break;
  }
  return <Popup content={popup} trigger={<Label as="a" tag color="blue" content={label} />} />;
};

export default SqlResults;
