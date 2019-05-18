import React, { Fragment } from 'react';
import { inject } from 'mobx-react';
import SessionStore from '../stores/session_store';
import { Icon, Header, Divider, Form, Menu } from 'semantic-ui-react';
import { RouterStore } from 'mobx-react-router';
import DbSqlIcon from '../shared/DbSqlIcon';
import Logout from './Navigation/Logout';
import Footer from './Navigation/Footer';

interface InjectedProps {
  sessionStore: SessionStore;
  routerStore: RouterStore;
}

@inject('sessionStore', 'routerStore')
export default class Dashboard extends React.Component {
  constructor(props: {}) {
    super(props);
  }

  get injected() {
    return this.props as InjectedProps;
  }

  render() {
    const router = this.injected.routerStore;
    return (
      <Fragment>
        <header>
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
        </header>
        <main className="no-sidebar">
          <Header as="h1" content="Welcome to DB SQL" />
        </main>
        <Footer />
      </Fragment>
    );
  }

}