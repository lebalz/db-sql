import { action, computed } from 'mobx';
import { inject, observer } from 'mobx-react';
import React, { Fragment } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import { Button, Icon, Label } from 'semantic-ui-react';
import { ResultState } from '../../../api/db_server';
import { QueryResult } from '../../../models/QueryEditor';
import { CopyState } from '../../../models/Result';
import { copyIcon, copyIconColor, labelColor } from '../../../shared/helpers';
import Tooltip from '../../../shared/Tooltip';
import ViewStateStore from '../../../stores/view_state_store';
import { TimeLabel } from '../ResultIndex';
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
  render() {
    const result = this.props.result;
    return (
      <Fragment>
        <Tooltip
          content={<PrismCode code={this.props.rawQuery} language="sql" plugins={['line-numbers']} />}
          disabled={this.props.disabled}
        >
          <Label
            size="large"
            color={labelColor(result.data)}
            content={`Query #${this.props.index + 1}`}
            style={{ marginRight: '1em', color: 'black' }}
          />
        </Tooltip>
        {<TimeLabel result={result.data} />}
        <div className="spacer" />
        <Fragment>
          <Tooltip content="Copy Results as Markdown table" position="top right" delayed>
            <CopyToClipboard text={result.markdownTable} onCopy={(_, success) => result.onCopy(success)}>
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
