import React, { InputHTMLAttributes } from 'react';
import { inject } from 'mobx-react';
import SessionStore from '../stores/session_store';
import { Header, Form, Accordion, Icon } from 'semantic-ui-react';
import { RouterStore } from 'mobx-react-router';
import DbSqlIcon from '../shared/DbSqlIcon';
import Signup from './Signup';

interface InjectedProps {
  sessionStore: SessionStore;
  routerStore: RouterStore;
}

@inject('sessionStore', 'routerStore')
export default class Login extends React.Component {
  state = {
    signup: false
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
    document.querySelector<HTMLInputElement>('#password-input').value = '';
  }

  render() {
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
              id="password-input"
              onChange={e => this.password = e.target.value}
            />
            <Form.Button content="Login" type="submit" />
          </Form.Group>
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
      </main>
    );
  }

}