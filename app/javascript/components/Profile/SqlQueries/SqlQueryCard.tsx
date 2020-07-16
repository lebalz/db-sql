import React from 'react';
import { Label, Icon } from 'semantic-ui-react';
import { inject, observer } from 'mobx-react';
import Tooltip from '../../../shared/Tooltip';
import { computed } from 'mobx';
import SqlQueryStore from '../../../stores/sql_query_store';
import SqlQuery from '../../../models/SqlQuery';
import { DbType } from '../../../models/DbServer';
import SqlEditor from '../../DatabaseServer/Query/SqlEditor';
import RouterStore from '../../../stores/router_store';
import DbServerStore from '../../../stores/db_server_store';
import Database from '../../../models/Database';
import ClickableIcon from '../../../shared/ClickableIcon';
import { OwnerType } from '../../../api/db_server';

interface Props {
  sqlQuery: SqlQuery;
}

interface InjectedProps extends Props {
  sqlQueryStore: SqlQueryStore;
  routerStore: RouterStore;
  dbServerStore: DbServerStore;
}

@inject('sqlQueryStore', 'routerStore', 'dbServerStore')
@observer
export default class SqlQueryCard extends React.Component<Props> {
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
      <div key={this.sqlQuery.id} className="sql-query">
        <div className="card-labels">
          <Label content={this.sqlQuery.dbServerName} color="blue" basic size="mini" pointing="right" />
          <Label
            icon="database"
            content={this.sqlQuery.dbName}
            color="blue"
            basic
            size="mini"
            as="a"
            onClick={() => this.sqlQuery.showInEditor()}
          />
          <div className="spacer" />
          {ownerType === OwnerType.User ||
            (this.sqlQuery.isOwner && this.sqlQuery.isPrivate && (
              <ClickableIcon
                icon={this.sqlQuery.isFavorite ? 'star' : 'star outline'}
                color={this.sqlQuery.isFavorite ? 'yellow' : 'black'}
                onClick={() => this.sqlQuery.toggleIsFavorite()}
              />
            ))}
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
          <Label
            content={this.sqlQuery.dbServerType}
            color={this.sqlQuery.dbServerType === DbType.Psql ? 'blue' : 'orange'}
            size="mini"
          />
        </div>
        <div className="meta">{this.sqlQuery.createdAt.toLocaleString()}</div>
        <SqlEditor
          key={`${this.sqlQuery.id}-${this.sqlQuery.updatedAt}`}
          sql={this.sqlQuery}
          readOnly={true}
          className="editable"
          height={this.sqlQuery.lineCount * 1.4}
          heightUnit="em"
          maxHeight="22em"
          highlightActiveLine={false}
        />
      </div>
    );
  }
}
