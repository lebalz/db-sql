import React, { Fragment } from 'react';
import { Divider, Menu } from 'semantic-ui-react';
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
import DeleteAccount from './Profile/DeleteAccount';

interface MatchParams {
  part: string;
}

interface ProfileProps extends RouteComponentProps<MatchParams> {}

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

  render() {
    const router = this.injected.routerStore;
    const part = this.props.match.params.part;
    return (
      <Fragment>
        <header>
          <NavBar />
        </header>
        <Menu id="sidebar" style={{ margin: 0 }}>
          <Menu.Item
            name="account"
            icon="address card"
            active={part === 'account'}
            onClick={() => router.push('./account')}
          />
          <Menu.Item
            name="new password"
            icon="key"
            active={part === 'change_password'}
            onClick={() => router.push('./change_password')}
          />
          <Menu.Item
            name="delete account"
            icon="trash"
            active={part === 'delete_account'}
            onClick={() => router.push('./delete_account')}
          />
          {this.injected.sessionStore.currentUser.isAdmin && (
            <Fragment>
              <Divider horizontal content="Admin" />
              <Menu.Item
                name="users"
                icon="users"
                active={part === 'users'}
                onClick={() => router.push('./users')}
              />
            </Fragment>
          )}
        </Menu>
        <main style={{ alignItems: 'center' }}>
          {(() => {
            switch (part) {
              case 'account':
                return <Account />;
              case 'change_password':
                return <ChangePassword />;
              case 'delete_account':
                return <DeleteAccount />;
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
