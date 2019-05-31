import React from 'react';
import { inject, observer } from 'mobx-react';
import SessionStore, { RequestState } from '../stores/session_store';
import { Header, Form, Accordion, Icon, Message } from 'semantic-ui-react';
import { RouterStore } from 'mobx-react-router';
import DbSqlIcon from '../shared/DbSqlIcon';
import Signup from './Signup';
import ForgotPassword from './ForgotPassword';

interface InjectedProps {
  sessionStore: SessionStore;
  routerStore: RouterStore;
}

@inject('sessionStore', 'routerStore')
@observer
export default class Login extends React.Component {
  state = {
    signup: false,
    forgotPassword: false
  };

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
    this.password = '';
    const passwordInput = document.querySelector<HTMLInputElement>('#password-input');
    if (passwordInput) passwordInput.value = '';
  }

  get queryParams() {
    return new URLSearchParams(this.injected.routerStore.location.search);
  }

  render() {
    const { passwordState } = this.injected.sessionStore;
    return (
      <main
        className="fullscreen"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          flexDirection: 'column'
        }}
      >
        <div>
          <DbSqlIcon size="massive" />
          <Header as="h1" textAlign="center" style={{ marginTop: '40px' }}>
            DB SQL
            </Header>
        </div>
        <Form
          onSubmit={() => this.login()}
          error={passwordState === RequestState.Error}
          success={this.queryParams.get('reset') === 'success'}
        >
          <Message
            success
            content="Password successfully reset. Login with the new password."
          />
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
              id="password-input"
              onChange={e => this.password = e.target.value}
            />
            <Form.Button
              content="Login"
              type="submit"
              loading={passwordState === RequestState.Waiting}
            />
          </Form.Group>
          <Message
            error
            header="Login Failed"
            content="E-Mail or Password is incorrect"
          />
        </Form>
        <Accordion>
          <Accordion.Title
            active={this.state.signup}
            onClick={() => this.setState({ signup: !this.state.signup })}
          >
            <Icon name="users" />
            Signup to DB-SQL
          </Accordion.Title>
          <Accordion.Content active={this.state.signup}>
            <Signup />
          </Accordion.Content>
        </Accordion>
        <Accordion>
          <Accordion.Title
            active={this.state.forgotPassword}
            onClick={() => this.setState({ forgotPassword: !this.state.forgotPassword })}
          >
            Forgot password?
          </Accordion.Title>
          <Accordion.Content active={this.state.forgotPassword}>
            <ForgotPassword />
          </Accordion.Content>
        </Accordion>
      </main>
    );
  }

}