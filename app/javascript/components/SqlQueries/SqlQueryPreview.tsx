import React, { Fragment } from 'react';
import { Label, Icon, TextArea, Message } from 'semantic-ui-react';
import { inject, observer } from 'mobx-react';
import Tooltip from '../../shared/Tooltip';
import { computed } from 'mobx';
import SqlQueryStore from '../../stores/sql_query_store';
import SqlQuery from '../../models/SqlQuery';
import { DbType } from '../../models/DbServer';
import SqlEditor from '../Workbench/QueryEditor/SqlEditor';
import RouterStore from '../../stores/router_store';
import DbServerStore from '../../stores/db_server_store';
import { OwnerType } from '../../api/db_server';
import ClickableIcon from '../../shared/ClickableIcon';
import { PrismCode } from '../Workbench/SqlResult/PrismCode';
import ViewStateStore from '../../stores/view_state_store';

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
          <div className="query-actions">
            {(ownerType === OwnerType.User || (this.sqlQuery.isOwner && this.sqlQuery.isPrivate)) && (
              <ClickableIcon
                icon={this.sqlQuery.isFavorite ? 'star' : 'star outline'}
                color={this.sqlQuery.isFavorite ? 'yellow' : 'black'}
                onClick={() => this.sqlQuery.toggleIsFavorite()}
              />
            )}
            {(ownerType === OwnerType.User || (this.sqlQuery.isOwner && this.sqlQuery.isPrivate)) && (
              <ClickableIcon
                icon={this.sqlQuery.isValid ? 'play' : 'edit'}
                color={this.sqlQuery.isValid ? 'green' : 'blue'}
                tooltip="Insert in the Editor"
                onClick={() => this.sqlQuery.insertInEditor()}
              />
            )}
            {ownerType === OwnerType.Group && this.sqlQuery.isOwner && (
              <ClickableIcon
                icon={this.sqlQuery.isPrivate ? 'lock' : 'lock open'}
                onClick={() => this.sqlQuery.toggleIsPrivate()}
                tooltip={
                  this.sqlQuery.isPrivate ? 'Share this query with your group' : 'Revoke sharing in the group'
                }
                delayed
                tooltipPosition="top right"
              />
            )}
          </div>
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
