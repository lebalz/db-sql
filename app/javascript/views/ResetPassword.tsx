import React from 'react';
import { inject, observer } from 'mobx-react';
import SessionStore, { RequestState } from '../stores/session_store';
import { Header, Form, Message } from 'semantic-ui-react';
import { RouterStore } from 'mobx-react-router';
import DbSqlIcon from '../shared/DbSqlIcon';
import { RouteComponentProps } from 'react-router';
import { resetPassword as resetPasswordCall } from '../api/user';

interface MatchParams {
  id: string;
}
interface ResetPasswordProps extends RouteComponentProps<MatchParams> { }

interface InjectedProps extends ResetPasswordProps {
  sessionStore: SessionStore;
  routerStore: RouterStore;
}

enum PasswordState { None, InvalidLength, NotEqual, Ok, InvalidRequest }

@inject('sessionStore', 'routerStore')
@observer
export default class ResetPassword extends React.Component<ResetPasswordProps> {
  state = {
    passwordState: PasswordState.None,
    resetState: null,
    requestState: RequestState.None
  };

  private password: string = '';
  private passwordConfirmation: string = '';
  get injected() {
    return this.props as InjectedProps;
  }

  get id() {
    return this.props.match.params.id;
  }

  get queryParams() {
    return new URLSearchParams(this.props.location.search);
  }

  resetPassword() {
    if (!this.validatePassword()) return;
    this.setState({ requestState: RequestState.Waiting });
    const query = new URLSearchParams(this.props.location.search);
    resetPasswordCall(
      this.id,
      this.queryParams.get('reset_token') || '',
      this.password,
      this.passwordConfirmation
    ).then(() => {
      this.setState({ requestState: RequestState.Success });
      this.injected.routerStore.push('/login?reset=success');
    }).catch((error) => {
      this.setState({ requestState: RequestState.Error });
      const msg = error.response.data.error || 'Unexpected server error';
      this.setState({ resetState: msg });
    });
  }

  validatePassword(): boolean {
    if (this.password !== this.passwordConfirmation) {
      this.setState({ passwordState: PasswordState.NotEqual });
    } else if (this.password.length < 8 || this.password.length > 128) {
      this.setState({ passwordState: PasswordState.InvalidLength });
    } else {
      this.setState({ passwordState: PasswordState.Ok });
    }
    return this.state.passwordState === PasswordState.Ok;
  }

  get hasError() {
    return (
      [PasswordState.InvalidLength, PasswordState.NotEqual].includes(this.state.passwordState)
      || !!this.state.resetState
    );
  }

  get errors(): string[] {
    const error_list: string[] = [];
    if (this.state.passwordState === PasswordState.InvalidLength) {
      error_list.push('Password length must be between 8 and 128 characters.');
    }
    if (this.state.passwordState === PasswordState.NotEqual) {
      error_list.push("The password confirmation doesn't match the password");
    }
    if (this.state.resetState) {
      error_list.push(`Reset failed: ${this.state.resetState}`);
    }
    return error_list;
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
          <DbSqlIcon size="large" />
          <Header as="h1" textAlign="center" style={{ marginTop: '40px' }}>
            DB SQL
          </Header>
        </div>
        <Form
          onSubmit={() => this.resetPassword()}
          error={this.hasError}
        >
          <Form.Group>
            <Form.Input
              icon="key"
              iconPosition="left"
              placeholder="New Password"
              label="Password"
              type="password"
              name="password"
              onChange={e => this.password = e.target.value}
            />
          </Form.Group>
          <Form.Group>
            <Form.Input
              icon="key"
              iconPosition="left"
              type="password"
              label="Confirmation"
              placeholder="Passwort Confirmation"
              name="passwordConfirmation"
              onChange={e => this.passwordConfirmation = e.target.value}
            />
          </Form.Group>
          <Message
            error
            header="Invalid password reset"
            list={this.errors}
          />
          <Form.Button
            content="Reset Password"
            loading={this.state.resetState === RequestState.Waiting}
            type="submit"
          />
        </Form>
      </main>
    );
  }

}