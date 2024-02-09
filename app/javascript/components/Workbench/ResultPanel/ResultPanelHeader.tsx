import { action, computed } from 'mobx';
import { inject, observer } from 'mobx-react';
import React, { Fragment } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import { Button, ButtonGroup, ButtonProps, Icon, Label, Popup, SemanticCOLORS } from 'semantic-ui-react';
import { MultiQueryResult, ResultState } from '../../../api/db_server';
import { QueryResult } from '../../../models/QueryEditor';
import Result, { CopyState, TableData } from '../../../models/Result';
import { copyIcon, copyIconColor } from '../../../shared/helpers';
import Tooltip from '../../../shared/Tooltip';
import ViewStateStore from '../../../stores/view_state_store';
import { PrismCode } from '../SqlResult/PrismCode';

interface Props {
  index: number;
  queryName: string;
  rawQuery: string;
  disabled: boolean;
  result: QueryResult;
}

interface InjectedProps extends Props {
  viewStateStore: ViewStateStore;
}

const labelColor = (result: Result<MultiQueryResult>): SemanticCOLORS => {
  switch (result.state) {
    case ResultState.Error:
      return 'red';
    case ResultState.Skipped:
      return 'yellow';
    case ResultState.Success:
      return 'green';
  }
};

const TimeLabel = ({result}: {result: Result<MultiQueryResult>}) => {
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
      if (result.limitReached) {
        popup = `Time: ${time}s, the limit of ${result.result?.length || 0} rows was reached. Further rows were not fetched.`;
        label = `MAX LENGTH* in ${time.toFixed(2)}s`;
      } else {
        popup = `Time: ${time}s`;
        label = `${result.result?.length || 0} in ${time.toFixed(2)}s`;
      }
      break;
    case ResultState.Skipped:
      popup = `Time: ${time}s`;
      label = `${time.toFixed(2)}s`;
      break;
  }
  return <Popup content={popup} trigger={<Label as="a" tag color="blue" content={label} />} />;
};


@inject('viewStateStore')
@observer
export default class ResultPanelHeader extends React.Component<Props> {
  @computed
  get injected() {
    return this.props as InjectedProps;
  }

  @computed
  get viewState() {
    return this.injected.viewStateStore.resultTableState(`${this.props.queryName}#${this.props.index}`);
  }

  @action
  onShowGraph(event: React.MouseEvent<HTMLElement, MouseEvent>, idx: number) {
    event.preventDefault();
    event.stopPropagation();
    this.viewState.showGraph = !this.viewState.showGraph;
  }
  onDisplayMode = (mode: 'table' | 'sql' | 'markdown' | 'json') => {
    return (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      this.props.result.setDisplayMode(mode);
    }
  }
  render() {
    const result = this.props.result;
    return (
      <Fragment>
        <Tooltip
          content={<PrismCode trim code={this.props.rawQuery} language="sql" plugins={['line-numbers']} />}
          disabled={this.props.disabled}
        >
          <Label
            size="large"
            color={labelColor(result)}
            content={`Query #${this.props.index + 1}`}
            style={{ marginRight: '1em', color: 'black' }}
          />
        </Tooltip>
        {<TimeLabel result={result} />}
        <div className="spacer" />
        <Fragment>
          <ButtonGroup 
            size="mini"
            buttons={[
              { key: 'table', content: 'Table', active: result.displayMode === 'table', onClick: (e: React.MouseEvent<HTMLButtonElement>) => {e.stopPropagation(); result.setDisplayMode('table')} },
              { key: 'md', content: 'MD', active: result.displayMode === 'markdown', onClick: (e: React.MouseEvent<HTMLButtonElement>) => {e.stopPropagation(); result.setDisplayMode('markdown')} },
              { key: 'sql', content: 'RAW', active: result.displayMode === 'sql', onClick: (e: React.MouseEvent<HTMLButtonElement>) => {e.stopPropagation(); result.setDisplayMode('sql')} },
              { key: 'json', content: 'JSON', active: result.displayMode === 'json', onClick: (e: React.MouseEvent<HTMLButtonElement>) => {e.stopPropagation(); result.setDisplayMode('json')} },
            ]}
          />
          <Tooltip content="Copy Result" position="top right" delayed>
            <CopyToClipboard text={result.resultString} onCopy={(_, success) => result.onCopy(success)}>
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
                active={!!this.viewState}
                icon={
                  <Icon.Group>
                    <Icon name="area graph" color="blue" />
                  </Icon.Group>
                }
                onClick={(e) => this.onShowGraph(e, this.props.index)}
              />
            </Tooltip>
          )}
        </Fragment>
      </Fragment>
    );
  }
}
