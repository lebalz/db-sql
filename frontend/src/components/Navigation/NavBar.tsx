import React, { Fragment } from 'react';
import DbSqlIcon from '../../shared/DbSqlIcon';
import { Header, Menu, Icon, Step, Popup } from 'semantic-ui-react';
import { inject, observer } from 'mobx-react';
import { computed } from 'mobx';
import { RouterStore } from 'mobx-react-router';
import SessionStore, { ApiRequestState } from '../../stores/session_store';
import DbServerStore from '../../stores/db_server_store';

interface InjectedProps {
  sessionStore: SessionStore;
  routerStore: RouterStore;
  dbServerStore: DbServerStore;
}

@inject('sessionStore', 'routerStore', 'dbServerStore')
@observer
export default class NavBar extends React.Component {
  get injected() {
    return this.props as InjectedProps;
  }

  render() {
    const router = this.injected.routerStore;
    const session = this.injected.sessionStore;
    const { resendActivationLinkState } = session;
    return (
      <Fragment>
        <Menu secondary pointing>
          <Menu.Item onClick={() => router.push(session.lastRouteContext('/dashboard'))}>
            <DbSqlIcon size="large" />
            <Header as="h2" content="DB SQL" style={{ marginLeft: '0.5rem' }} />
          </Menu.Item>
          <Menu.Item
            style={{ marginLeft: '2em' }}
            name="Dashboard"
            active={router.location.pathname === '/dashboard'}
            onClick={() => router.push(session.lastRouteContext('/dashboard'))}
          >
            <Icon name="database" />
            Dashboard
          </Menu.Item>
          <Menu.Item
            style={{ marginLeft: '2em' }}
            name="Profile"
            active={router.location.pathname.startsWith('/profile/')}
            onClick={() => router.push(session.lastRouteContext('/profile', 'account'))}
          >
            <Icon name="user" />
            Profile
          </Menu.Item>
          {this.injected.dbServerStore.loadedDbServers.length > 0 && (
            <Menu.Item
              style={{ marginLeft: '2em' }}
              name="Connections"
              active={router.location.pathname.startsWith('/connections')}
              onClick={() => {
                const { activeDbServer: activeConnection } = this.injected.dbServerStore;
                if (!activeConnection) {
                  return;
                }
                router.push(`/connections/${activeConnection.id}`);
              }}
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
                    <a onClick={() => this.injected.sessionStore.resendActivationLink()} href="#">
                      Resend the activation link
                    </a>
                    {resendActivationLinkState.state !== ApiRequestState.None && (
                      <ResendIcon resendState={this.injected.sessionStore.resendActivationLinkState.state} />
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
              name="About"
              active={router.location.pathname === '/about'}
              onClick={() => router.push('/about')}
            />
            <Menu.Item name="Logout" onClick={() => this.injected.sessionStore.logout()} />
          </Menu.Menu>
        </Menu>
      </Fragment>
    );
  }
}

const resendIconName = (resendState: ApiRequestState) => {
  switch (resendState) {
    case ApiRequestState.Error:
      return 'times circle';
    case ApiRequestState.Success:
      return 'check circle';
    default:
      return 'refresh';
  }
};

const resendIconColor = (resendState: ApiRequestState) => {
  switch (resendState) {
    case ApiRequestState.Error:
      return 'red';
    case ApiRequestState.Success:
      return 'green';
    default:
      return 'grey';
  }
};

export const ResendIcon = ({ resendState }: { resendState: ApiRequestState }) => {
  return (
    <Icon
      loading={resendState === ApiRequestState.Waiting}
      name={resendIconName(resendState)}
      color={resendIconColor(resendState)}
    />
  );
};
