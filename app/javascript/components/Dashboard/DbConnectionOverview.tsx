import React from 'react';
import { observer, inject } from 'mobx-react';
import DbConnection, { DbType } from '../../models/DbConnection';
import { Card, Label, Button } from 'semantic-ui-react';
import DbServerStore from '../../stores/db_server_store';
import { TempDbConnection, TempDbConnectionRole } from '../../models/TempDbConnection';
import { action } from 'mobx';
import { RouterStore } from 'mobx-react-router';

interface Props {
  dbConnection: DbConnection;
  style?: React.CSSProperties;
}

interface InjectedProps extends Props {
  dbServerStore: DbServerStore;
  routerStore: RouterStore;
}

@inject('dbServerStore', 'routerStore')
@observer
export default class DbConnectionOverview extends React.Component<Props> {
  get injected() {
    return this.props as InjectedProps;
  }

  get dbConnection() {
    return this.props.dbConnection;
  }

  @action connect() {
    this.injected.routerStore.push(`/connections/${this.dbConnection.id}`);
  }

  render() {
    const { name, host, port, dbType } = this.dbConnection;
    return (
      <Card style={this.props.style}>
        <Card.Content>
          <Card.Header content={name} />
          <Card.Meta content={`${host}:${port}`} />
          <Label content={dbType} color={dbType === DbType.MySql ? 'orange' : 'blue'} />
        </Card.Content>
        <Card.Content extra>
          <Button
            floated="left"
            circular
            icon="settings"
            onClick={() => {
              const temp = new TempDbConnection(
                this.dbConnection.props,
                TempDbConnectionRole.Update,
                this.dbConnection.cancelToken
              );
              this.injected.dbServerStore.setTempDbConnection(temp);
            }}
          />
          <Button
            basic
            color="green"
            floated="right"
            content="Connect"
            icon="plug"
            onClick={() => this.connect()}
          />
        </Card.Content>
      </Card>
    );
  }
}
