import React, { Fragment } from 'react';
import { Segment, Menu, Icon, Accordion, InputOnChangeData } from 'semantic-ui-react';
import NavBar from './Navigation/NavBar';
import { inject, observer } from 'mobx-react';
import SessionStore from '../stores/session_store';
import Footer from './Navigation/Footer';
import { RouteComponentProps } from 'react-router';
import Account from './Profile/Account';
import ChangePassword from './Profile/ChangePassword';
import { RouterStore } from 'mobx-react-router';
import UserStore from '../stores/user_store';
import UserList from './Profile/UserList';

interface MatchParams {
  part: string;
}

interface ProfileProps extends RouteComponentProps<MatchParams> { }

interface InjectedProps extends ProfileProps {
  sessionStore: SessionStore;
  routerStore: RouterStore;
  userStore: UserStore;
}

@inject('sessionStore', 'routerStore', 'userStore')
@observer
export default class Profile extends React.Component<ProfileProps> {
  get injected() {
    return this.props as InjectedProps;
  }

  get part() {
    return this.props.match.params.part;
  }

  render() {
    const router = this.injected.routerStore;
    return (
      <Fragment>
        <header>
          <NavBar />
        </header>
        <Menu id="sidebar" style={{ margin: 0 }}>
          <Menu.Item
            name="account"
            active={this.part === 'account'}
            onClick={() => router.push('./account')}
          />
          <Menu.Item
            name="new password"
            active={this.part === 'change_password'}
            onClick={() => router.push('./change_password')}
          />
          {
            this.injected.sessionStore.currentUser.isAdmin &&
            <Menu.Item
              name="users"
              active={this.part === 'users'}
              onClick={() => router.push('./users')}
            />
          }
        </Menu>
        <main style={{ alignItems: 'center' }}>
          {(() => {
            switch (this.part) {
              case 'account':
                return <Account />;
              case 'change_password':
                return <ChangePassword />;
              case 'users':
                return <UserList />;
              default:
                return '404';
            }
          })()}
        </main>
        <Footer />
      </Fragment>
    );
  }

}