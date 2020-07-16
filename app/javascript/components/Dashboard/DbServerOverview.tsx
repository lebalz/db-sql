import React from 'react';
import { observer, inject } from 'mobx-react';
import DbServer, { DbType } from '../../models/DbServer';
import { Card, Label, Button } from 'semantic-ui-react';
import DbServerStore from '../../stores/db_server_store';
import { TempDbServer, TempDbServerRole } from '../../models/TempDbServer';
import { action, computed } from 'mobx';
import { RouterStore } from 'mobx-react-router';
import Tooltip from '../../shared/Tooltip';
import SchemaQueryStore from '../../stores/schema_query_store';
import GroupStore from '../../stores/group_store';
import { OwnerType } from '../../api/db_server';
import Group from '../../models/Group';

interface Props {
  dbConnection: DbServer;
}

interface InjectedProps extends Props {
  dbServerStore: DbServerStore;
  routerStore: RouterStore;
  schemaQueryStore: SchemaQueryStore;
  groupStore: GroupStore;
}

@inject('dbServerStore', 'routerStore', 'schemaQueryStore', 'groupStore')
@observer
export default class DbServerOverview extends React.Component<Props> {
  get injected() {
    return this.props as InjectedProps;
  }

  get dbConnection() {
    return this.props.dbConnection;
  }

  @action connect() {
    this.injected.routerStore.push(this.dbConnection.link);
  }

  @computed
  get queryCount() {
    const { queryCount } = this.dbConnection;
    if (queryCount < 1000) {
      return queryCount.toFixed(0);
    }
    if (queryCount < 1000000) {
      return `${(queryCount / 1000).toFixed(1)}K`;
    }
    return `${(queryCount / 1000000).toFixed(2)}M`;
  }

  @computed
  get owner(): Group | undefined {
    if (this.dbConnection.ownerType === OwnerType.Group) {
      return this.injected.groupStore.find(this.dbConnection.ownerId);
    }
  }

  render() {
    const { name, host, port, dbType, queryCount, errorQueryCount } = this.dbConnection;
    return (
      <Card className="db-server-card">
        <Card.Content>
          <Card.Header content={name} />
          <Card.Meta content={`${host}:${port}`} />
          <Label content={dbType} color={dbType === DbType.MySql ? 'orange' : 'blue'} />
        </Card.Content>
        <Tooltip
          content={
            <p>
              Executed Queries: {queryCount.toLocaleString()}
              <br />
              Errors: {errorQueryCount}
            </p>
          }
        >
          <div className="query-count">{this.queryCount}</div>
        </Tooltip>
        <Card.Content extra>
          <Button
            floated="left"
            circular
            icon="settings"
            onClick={() => this.dbConnection.edit()}
            disabled={this.dbConnection.ownerType === OwnerType.Group && this.dbConnection.isOutdated}
          />
          <Button
            basic
            color={this.dbConnection.isOutdated ? 'red' : 'green'}
            floated="right"
            content="Connect"
            icon={this.dbConnection.isOutdated ? 'warning' : 'plug'}
            onClick={() => this.connect()}
            disabled={this.dbConnection.isOutdated}
          />
        </Card.Content>
      </Card>
    );
  }
}
