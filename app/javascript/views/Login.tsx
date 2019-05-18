import React, { Fragment } from 'react';
import { inject } from 'mobx-react';
import SessionStore from '../stores/session_store';
import { Icon, Header, Divider, Form } from 'semantic-ui-react';

interface InjectedProps {
  sessionStore: SessionStore;
}

@inject('sessionStore')
export default class Login extends React.Component {
  private email: string = '';
  private password: string = '';

  get injected() {
    return this.props as InjectedProps;
  }

  login() {
    this.injected.sessionStore.login(
      this.email,
      this.password
    );
  }

  render() {
    return (
      <Fragment>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            flexDirection: 'column',
            height: '80vh'
          }}
        >
          <div>
            <Icon.Group size="massive">
              <Icon circular inverted color="teal" name="gem" />
              <Icon corner="bottom right" color="violet" name="database" />
            </Icon.Group>
            <Header as="h1" textAlign="center" style={{ marginTop: '40px' }}>
              DB SQL
            </Header>
          </div>
          <Form onSubmit={() => this.login()}>
            <Form.Group>
              <Form.Input
                icon="at"
                iconPosition="left"
                placeholder="E-Mail"
                name="email"
                onChange={e => this.email = e.target.value}
              />
              <Form.Input
                icon="key"
                iconPosition="left"
                type="password"
                placeholder="Passwort"
                name="password"
                onChange={e => this.password = e.target.value}
              />
              <Form.Button content="Login" type="submit" />
            </Form.Group>
          </Form>
        </div>
      </Fragment>
    );
  }

}