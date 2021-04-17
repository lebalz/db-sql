import React from 'react';
import { Icon, Message } from 'semantic-ui-react';
import { inject, observer } from 'mobx-react';
import Tooltip from '../../shared/Tooltip';
import { action, computed } from 'mobx';
import SqlQuery from '../../models/SqlQuery';
import { OwnerType } from '../../api/db_server';
import { PrismCode } from '../Workbench/SqlResult/PrismCode';
import ViewStateStore from '../../stores/view_state_store';
import fileDownload from 'js-file-download';
import { CopyState } from '../../models/Result';
import SqlQueryActions from './SqlQueryActions';

interface Props {
  sqlQuery: SqlQuery;
}

interface InjectedProps extends Props {
  viewStateStore: ViewStateStore;
}

@inject('viewStateStore')
@observer
export default class SqlQueryPreview extends React.Component<Props> {
  get injected() {
    return this.props as InjectedProps;
  }

  @computed
  get sqlQuery() {
    return this.props.sqlQuery;
  }
  render() {
    const ownerType = this.sqlQuery.dbServerOwnerType;
    return (
      <div
        key={this.sqlQuery.id}
        onMouseOver={() => {
          this.injected.viewStateStore.cancelPreviewTimeout(this.sqlQuery.scope, this.sqlQuery.id);
        }}
        onMouseLeave={() => {
          this.injected.viewStateStore.unsetPreviewQuery(this.sqlQuery.scope, this.sqlQuery.id);
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
          <SqlQueryActions
            sqlQuery={this.sqlQuery}
            onPlay={() => this.sqlQuery.insertInEditor()}
            playTooltip="Insert in the editor"
          />
          <div className="query-labels">
            {ownerType && (
              <Tooltip
                delayed
                position="top right"
                content={
                  ownerType === OwnerType.Group
                    ? 'Executed on a shared db connection'
                    : 'Executed on a personal db connection'
                }
              >
                <Icon className="centered" name={ownerType === OwnerType.Group ? 'group' : 'user'} />
              </Tooltip>
            )}
            <Tooltip
              delayed
              position="top right"
              content={this.sqlQuery.isValid ? 'Successful executed' : 'Execution resulted in errors'}
            >
              <Icon
                className="centered"
                name={this.sqlQuery.isValid ? 'check' : 'close'}
                color={this.sqlQuery.isValid ? 'green' : 'red'}
              />
            </Tooltip>
            {this.sqlQuery.execTime && (
              <Tooltip delayed position="top right" content={`Executed in ${this.sqlQuery.execTime}s`}>
                <span>
                  <Icon className="centered" name="clock" color="black" />
                  {` ${this.sqlQuery.execTime.toFixed(2)}s`}
                </span>
              </Tooltip>
            )}
          </div>
          <div>
            <i>{this.sqlQuery.createdAt.toLocaleString()}</i>
          </div>
        </div>
        <PrismCode
          code={this.sqlQuery.query}
          language="sql"
          plugins={['line-numbers']}
          style={{ maxHeight: '22em', fontSize: 'smaller' }}
        />
        {this.sqlQuery.errors.map((err) => {
          return (
            <Message error size="mini" key={err.query_idx}>
              <Message.Header>{`Error in the ${err.query_idx + 1}. query`}</Message.Header>
              <p>{err.error}</p>
            </Message>
          );
        })}
      </div>
    );
  }
}
