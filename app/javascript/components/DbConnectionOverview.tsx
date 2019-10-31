import React from 'react';
import { observer, inject } from 'mobx-react';
import DbConnection, { DbType } from '../models/DbConnection';
import { Card, Label, Button } from 'semantic-ui-react';
import DbConnectionStore from '../stores/db_connection_store';
import { TempDbConnection, TempDbConnectionRole } from '../models/TempDbConnection';

interface Props {
  dbConnection: DbConnection;
  style?: React.CSSProperties;
}

interface InjectedProps extends Props {
  dbConnectionStore: DbConnectionStore;
}

@inject('dbConnectionStore')
@observer
export default class DbConnectionOverview extends React.Component<Props> {

  get injected() {
    return this.props as InjectedProps;
  }

  get dbConnection() {
    return this.props.dbConnection;
  }

  render() {
    const { name, host, port, dbType } = this.dbConnection;
    return (
      <Card style={this.props.style}>
        <Card.Content>
          <Card.Header content={name} />
          <Card.Meta content={`${host}:${port}`} />
          <Label
            content={dbType}
            color={dbType === DbType.MySql ? 'orange' : 'blue'}
          />
        </Card.Content>
        <Card.Content extra>
          <Button
            floated="left"
            circular
            icon="settings"
            onClick={
              () => {
                const temp = new TempDbConnection(this.dbConnection.props, TempDbConnectionRole.Update);
                this.injected.dbConnectionStore.tempDbConnection = temp;
              }
            }
          />
          <Button
            basic
            color="green"
            floated="right"
          >
            Connect
          </Button>
        </Card.Content>
      </Card>
    )
  }

}