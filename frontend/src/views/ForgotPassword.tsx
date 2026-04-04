import React from 'react';
import { Form, Message } from 'semantic-ui-react';
import { inject, observer } from 'mobx-react';
import SessionStore, { ApiRequestState } from '../stores/session_store';
import { requestPasswordReset } from '../api/user';

interface InjectedProps {
  sessionStore: SessionStore;
}

@inject('sessionStore')
@observer
export default class ForgotPassword extends React.Component {
  state = {
    resetState: ApiRequestState.None
  };
  private email: string = '';

  get injected() {
    return this.props as InjectedProps;
  }

  resetPassword() {
    this.setState({ resetState: ApiRequestState.Waiting });
    requestPasswordReset(this.email)
      .then(() => {
        this.setState({ resetState: ApiRequestState.Success });
      })
      .catch(() => {
        this.setState({ resetState: ApiRequestState.Error });
      });
  }

  render() {
    return (
      <Form
        onSubmit={() => this.resetPassword()}
        error={this.state.resetState === ApiRequestState.Error}
        success={this.state.resetState === ApiRequestState.Success}
      >
        <Form.Group>
          <Form.Input
            icon="mail"
            iconPosition="left"
            error={this.state.resetState === ApiRequestState.Error}
            type="text"
            label="E-Mail"
            placeholder="E-Mail"
            name="email"
            onChange={(e) => (this.email = e.target.value)}
          />
        </Form.Group>
        <Message error header="Errors" content="No DB SQL account found for this email address." />
        <Message success header="Success" content="Mail with a reset link sent" />
        <Form.Button
          content="Send reset link"
          loading={this.state.resetState === ApiRequestState.Waiting}
          type="submit"
        />
      </Form>
    );
  }
}
