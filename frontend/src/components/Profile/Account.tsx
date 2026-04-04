import React from 'react';
import { Segment, Menu, Icon } from 'semantic-ui-react';
import { inject, observer } from 'mobx-react';
import SessionStore from '../../stores/session_store';
import User from '../../models/User';
import DbServerStore from '../../stores/db_server_store';
import { computed } from 'mobx';

interface InjectedProps {
  sessionStore: SessionStore;
  dbServerStore: DbServerStore;
}

@inject('sessionStore', 'dbServerStore')
@observer
export default class Account extends React.Component {
  get injected() {
    return this.props as InjectedProps;
  }

  @computed
  get queryCount() {
    return this.injected.dbServerStore.dbServers.reduce((cnt, dbServer) => cnt + dbServer.queryCount, 0);
  }

  @computed
  get errorQueryCount() {
    return this.injected.dbServerStore.dbServers.reduce((cnt, dbServer) => cnt + dbServer.errorQueryCount, 0);
  }

  render() {
    const { currentUser } = this.injected.sessionStore;
    return (
      <Segment piled className="flex-list" style={{ minWidth: '350px' }}>
        <div className="flex-list-item">
          <Menu.Item>
            <Icon name="mail" />
            Mail
          </Menu.Item>
          {currentUser.email}
        </div>
        <div className="flex-list-item">
          <Menu.Item>
            <Icon name="users" />
            Member Since
          </Menu.Item>
          {User.formatDate(currentUser.createdAt)}
        </div>
        <div className="flex-list-item">
          <Menu.Item>
            <Icon name="refresh" />
            Updated
          </Menu.Item>
          {User.formatDate(currentUser.updatedAt)}
        </div>
        <div className="flex-list-item">
          <Menu.Item>
            <Icon name="log out" />
            Login Count
          </Menu.Item>
          {currentUser.loginCount}
        </div>
        <div className="flex-list-item">
          <Menu.Item>
            <Icon name="weight" />
            Executed Queries
          </Menu.Item>
          {this.queryCount}
        </div>
        <div className="flex-list-item">
          <Menu.Item>
            <Icon name="ban" />
            Erroneous Queries
          </Menu.Item>
          {this.errorQueryCount}
        </div>
      </Segment>
    );
  }
}
