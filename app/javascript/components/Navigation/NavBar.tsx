import React, { Fragment } from 'react';
import DbSqlIcon from '../../shared/DbSqlIcon';
import { Header, Menu, Icon } from 'semantic-ui-react';
import { inject } from 'mobx-react';
import { RouterStore } from 'mobx-react-router';
import SessionStore from '../../stores/session_store';

interface InjectedProps {
  sessionStore: SessionStore;
  routerStore: RouterStore;
}

@inject('sessionStore', 'routerStore')
export default class NavBar extends React.Component {

  get injected() {
    return this.props as InjectedProps;
  }

  render() {
    const router = this.injected.routerStore;
    return (
      <Menu secondary pointing>
        <Menu.Item
          onClick={() => router.push('/dashboard')}
        >
          <DbSqlIcon size="large" />
          <Header
            as="h2"
            content="DB SQL"
            style={{ marginLeft: '0.5rem' }}
          />
        </Menu.Item>
        <Menu.Item
          style={{ marginLeft: '2em' }}
          name="Dashboard"
          active={router.location.pathname === '/dashboard'}
          onClick={() => router.push('/dashboard')}
        >
          <Icon name="database" />
          Dashboard
        </Menu.Item>
        <Menu.Item
          style={{ marginLeft: '2em' }}
          name="Profile"
          active={router.location.pathname.startsWith('/profile/')}
          onClick={() => router.push('/profile/account')}
        >
          <Icon name="user" />
          Profile
        </Menu.Item>
        <Menu.Menu position="right">
          <Menu.Item
            name="Logout"
            onClick={() => this.injected.sessionStore.logout()}
          />
        </Menu.Menu>
      </Menu>
    );
  }
}
