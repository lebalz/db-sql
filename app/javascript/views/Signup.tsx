import React from 'react';
import { Form, InputOnChangeData, Message } from 'semantic-ui-react';
import { inject, observer } from 'mobx-react';
import SessionStore, { PasswordState } from '../stores/session_store';
import { signup } from '../api/user';


interface InjectedProps {
  sessionStore: SessionStore;
}

enum LoginState { None, Waiting, Success, Error };

@inject('sessionStore')
@observer
export default class Signup extends React.Component {
  state = {
    isSafe: true,
    loginState: LoginState.None
  };
  private email: string = '';
  private password: string = '';

  get injected() {
    return this.props as InjectedProps;
  }

  onChange = (event: React.ChangeEvent<HTMLInputElement>, data: InputOnChangeData) => {
    switch (data.name as String) {
      case 'email':
        this.email = event.target.value;
        break;
      case 'password':
        this.password = event.target.value;
        break;
    }
    if (!this.isValid) {
      this.validate();
    }
  }

  signup() {
    if (this.validate()) {
      this.setState({ loginState: LoginState.Waiting });
      signup(this.email, this.password).then(({ data }) => {
        this.injected.sessionStore.setCurrentUser(data);
        this.setState({ loginState: LoginState.Success });
      }).catch((error) => {
        console.log(error);
        this.setState({ loginState: LoginState.Error });
      });
    }
  }

  validate() {
    const isSafe = this.password.length >= 8 && this.password.length < 128;
    this.setState({
      isSafe: isSafe,
    });
    return isSafe;
  }

  get isValid() {
    return this.state.isSafe;
  }

  render() {
    const errorMessages: string[] = [];
    const createError = this.state.loginState === LoginState.Error;
    if (!this.state.isSafe) {
      errorMessages.push('The length of the new password must be between 8 and 128 characters.');
    }
    if (createError) {
      errorMessages.push('Your email address is not valid or already used.');
    }

    const validPassword = errorMessages.length === 0;
    return (
      <Form
        onSubmit={() => this.signup()}
        error={!validPassword || createError}
      >
        <Form.Group>
          <Form.Input
            icon="mail"
            iconPosition="left"
            error={createError}
            type="text"
            label="E-Mail"
            placeholder="E-Mail"
            name="email"
            onChange={this.onChange}
          />
        </Form.Group>
        <Form.Group>
          <Form.Input
            icon="key"
            iconPosition="left"
            error={!this.state.isSafe}
            type="password"
            label="Password"
            placeholder="Password"
            name="password"
            onChange={this.onChange}
          />
        </Form.Group>
        <Message
          error
          header="Errors"
          list={errorMessages}
        />
        <Form.Button
          content="Signup"
          loading={this.state.loginState === LoginState.Waiting}
          type="submit"
          disabled={!this.isValid}
        />
      </Form>

    );
  }

}