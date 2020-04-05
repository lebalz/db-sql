import React, { Fragment } from 'react';
import { Icon, List, Progress } from 'semantic-ui-react';
import DbServerStore from '../../../stores/db_server_store';
import { inject, observer } from 'mobx-react';
import { computed, reaction, IReactionDisposer } from 'mobx';
import _ from 'lodash';
import Database from '../../../models/Database';
import { REST } from '../../../declarations/REST';
import DatabaseStore from '../../../stores/database_store';

interface PlaceholderItemProps {
  dbName: string;
}

interface InjectedDbItemPorps extends PlaceholderItemProps {
  dbServerStore: DbServerStore;
  databaseStore: DatabaseStore;
}

@inject('dbServerStore', 'databaseStore')
@observer
export default class PlaceholderItem extends React.Component<PlaceholderItemProps> {
  state = { loading: false };
  get injected() {
    return this.props as InjectedDbItemPorps;
  }

  render() {
    const { dbName } = this.props;
    const { activeDbServerId } = this.injected.dbServerStore;
    return (
      <Fragment>
        <List.Item
          as="a"
          data-dbname={dbName}
          className="database-item"
          onClick={(e) => {
            if (activeDbServerId) {
              this.setState({ loading: true });
              this.injected.databaseStore.loadDatabase(activeDbServerId, dbName);
            }
          }}
        >
          <List.Content>
            <div style={{ display: 'flex' }}>
              <Icon fitted name="database" color="grey" />
              <span style={{ marginLeft: '10px' }}>{dbName}</span>
            </div>
          </List.Content>
        </List.Item>
        {this.state.loading && (
          <List.Item>
            <List.Content>
              <Progress color="teal" size="tiny" active />
            </List.Content>
          </List.Item>
        )}
      </Fragment>
    );
  }
}
