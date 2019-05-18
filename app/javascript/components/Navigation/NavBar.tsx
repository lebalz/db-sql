import React, { Fragment } from 'react';
import DbSqlIcon from '../../shared/DbSqlIcon';
import { Header, Menu } from 'semantic-ui-react';
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
        <Menu.Item>
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
          active
          onClick={() => router.push('/dashboard')}
        />
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
