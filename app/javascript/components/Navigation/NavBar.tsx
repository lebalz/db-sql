import React, { Fragment } from 'react';
import DbSqlIcon from '../../shared/DbSqlIcon';
import { Header, Menu, Icon, Step, Popup } from 'semantic-ui-react';
import { inject, observer } from 'mobx-react';
import { RouterStore } from 'mobx-react-router';
import SessionStore from '../../stores/session_store';
import { resendActivationLink } from '../../api/user';

interface InjectedProps {
  sessionStore: SessionStore;
  routerStore: RouterStore;
}

@inject('sessionStore', 'routerStore')
@observer
export default class NavBar extends React.Component {

  get injected() {
    return this.props as InjectedProps;
  }

  render() {
    const router = this.injected.routerStore;
    return (
      <Fragment>
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
          {
            !this.injected.sessionStore.currentUser.activated &&
            <Menu.Item style={{ paddingBottom: 0, marginLeft: '4em' }}>
              <Step.Group size="mini" className="activation">
                <Step completed>
                  <Step.Content>
                    <Step.Title>Create Account</Step.Title>
                  </Step.Content>
                </Step>
                <Popup
                  trigger={
                    <Step active link>
                      <Icon name="mail" />
                      <Step.Content>
                        <Step.Title>Confirm E-Mail</Step.Title>
                      </Step.Content>
                    </Step>
                  }
                  hoverable
                  wide
                  header="Account not activated"
                  content={
                    <div>
                      Check your mails and activate your account with sent activation link.
                      <br/>
                      Check your junkmails too.
                      <br/>
                      <a onClick={() => resendActivationLink()} href="#">Resend the activation link</a>
                    </div>
                  }
                  on="hover"
                />
                <Step disabled>
                  <Step.Content>
                    <Step.Title>Done</Step.Title>
                  </Step.Content>
                </Step>
              </Step.Group>
            </Menu.Item>
          }
          <Menu.Menu position="right">
            <Menu.Item
              name="Logout"
              onClick={() => this.injected.sessionStore.logout()}
            />
          </Menu.Menu>
        </Menu>
      </Fragment>
    );
  }
}
