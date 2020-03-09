import React, { Fragment } from 'react';
import DbSqlIcon from '../../shared/DbSqlIcon';
import { Header, Menu, Icon, Step, Popup } from 'semantic-ui-react';
import { inject, observer } from 'mobx-react';
import { computed } from 'mobx';
import { RouterStore } from 'mobx-react-router';
import SessionStore, { RequestState } from '../../stores/session_store';
import DbConnectionStore from '../../stores/db_connection_store';

interface InjectedProps {
  sessionStore: SessionStore;
  routerStore: RouterStore;
  dbConnectionStore: DbConnectionStore;
}

@inject('sessionStore', 'routerStore', 'dbConnectionStore')
@observer
export default class NavBar extends React.Component {
  get injected() {
    return this.props as InjectedProps;
  }

  @computed get resendIcon() {
    const { resendActivationLinkState } = this.injected.sessionStore;
    switch (resendActivationLinkState) {
      case RequestState.Error:
        return 'times circle';
      case RequestState.Success:
        return 'check circle';
      default:
        return 'refresh';
    }
  }

  @computed get resendIconColor() {
    const { resendActivationLinkState } = this.injected.sessionStore;
    switch (resendActivationLinkState) {
      case RequestState.Error:
        return 'red';
      case RequestState.Success:
        return 'green';
      default:
        return 'grey';
    }
  }

  render() {
    const router = this.injected.routerStore;
    const { dbConnectionStore } = this.injected;
    const { activeConnection } = dbConnectionStore;
    const connection =
      activeConnection || dbConnectionStore.dbConnections.length > 0
        ? dbConnectionStore.dbConnections[0]
        : undefined;
    const { resendActivationLinkState } = this.injected.sessionStore;
    return (
      <Fragment>
        <Menu secondary pointing>
          <Menu.Item onClick={() => router.push('/dashboard')}>
            <DbSqlIcon size="large" />
            <Header as="h2" content="DB SQL" style={{ marginLeft: '0.5rem' }} />
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
          {connection && (
            <Menu.Item
              style={{ marginLeft: '2em' }}
              name="Connections"
              active={router.location.pathname.startsWith('/connections')}
              onClick={() => router.push(`/connections/${connection.id}`)}
            >
              <Icon name="plug" />
              Connections
            </Menu.Item>
          )}
          {!this.injected.sessionStore.currentUser.activated && (
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
                  on="hover"
                >
                  <Popup.Header>Check your mails</Popup.Header>
                  <Popup.Content>
                    An activation link has been sent to you.
                    <br />
                    <a
                      onClick={() => this.injected.sessionStore.resendActivationLink()}
                      href="#"
                    >
                      Resend the activation link
                    </a>
                    {resendActivationLinkState !== RequestState.None && (
                      <Icon
                        loading={resendActivationLinkState === RequestState.Waiting}
                        name={this.resendIcon}
                        color={this.resendIconColor}
                      />
                    )}
                  </Popup.Content>
                </Popup>
                <Step disabled>
                  <Step.Content>
                    <Step.Title>Done</Step.Title>
                  </Step.Content>
                </Step>
              </Step.Group>
            </Menu.Item>
          )}
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
