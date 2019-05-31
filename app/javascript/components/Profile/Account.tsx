import React from 'react';
import { Segment, Menu, Icon } from 'semantic-ui-react';
import { inject, observer } from 'mobx-react';
import SessionStore from '../../stores/session_store';

interface InjectedProps {
  sessionStore: SessionStore;
}

@inject('sessionStore')
@observer
export default class Account extends React.Component {
  get injected() {
    return this.props as InjectedProps;
  }

  render() {
    const { currentUser } = this.injected.sessionStore;
    return (
      <Segment
        piled
        className="flex-list"
        style={{ minWidth: '350px' }}
      >
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
          {currentUser.createdAt.toLocaleDateString()}
        </div>
        <div className="flex-list-item">
          <Menu.Item>
            <Icon name="refresh" />
            Updated
              </Menu.Item>
          {`${currentUser.updatedAt.toLocaleDateString()} ${currentUser.updatedAt.toLocaleTimeString()}`}
        </div>
        <div className="flex-list-item">
          <Menu.Item>
            <Icon name="log out" />
            Login Count
              </Menu.Item>
          {currentUser.loginCount}
        </div>
      </Segment>
    );
  }

}