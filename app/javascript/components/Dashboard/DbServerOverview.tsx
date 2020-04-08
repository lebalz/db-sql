import React from 'react';
import { observer, inject } from 'mobx-react';
import DbServer, { DbType } from '../../models/DbServer';
import { Card, Label, Button } from 'semantic-ui-react';
import DbServerStore from '../../stores/db_server_store';
import { TempDbServer, TempDbServerRole } from '../../models/TempDbServer';
import { action } from 'mobx';
import { RouterStore } from 'mobx-react-router';

interface Props {
  dbConnection: DbServer;
  style?: React.CSSProperties;
}

interface InjectedProps extends Props {
  dbServerStore: DbServerStore;
  routerStore: RouterStore;
}

@inject('dbServerStore', 'routerStore')
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
              const temp = new TempDbServer(
                this.dbConnection.props,
                this.injected.dbServerStore,
                TempDbServerRole.Update,
                this.dbConnection.cancelToken
              );
              this.injected.dbServerStore.setTempDbServer(temp);
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
