import React from 'react';
import { Form, InputOnChangeData, Message, Segment, Header } from 'semantic-ui-react';
import { inject, observer } from 'mobx-react';
import { computed } from 'mobx';
import SessionStore, { PasswordState } from '../../stores/session_store';


interface InjectedProps {
  sessionStore: SessionStore;
}

@inject('sessionStore')
@observer
export default class ChangePassword extends React.Component {
  state = {
    isSafe: true,
    isConfirmed: true
  };
  private oldPassword: string = '';
  private newPassword: string = '';
  private newPasswordConfirmation: string = '';

  get injected() {
    return this.props as InjectedProps;
  }

  onChangePassword = (event: React.ChangeEvent<HTMLInputElement>, data: InputOnChangeData) => {
    switch (data.name as String) {
      case 'oldPassword':
        this.oldPassword = event.target.value;
        break;
      case 'newPassword':
        this.newPassword = event.target.value;
        break;
      case 'newPasswordConfirmation':
        this.newPasswordConfirmation = event.target.value;
        break;
    }
    if (!this.isValid) {
      this.validate();
    }
  }

  setNewPassword() {
    this.injected.sessionStore.passwordState = PasswordState.None;
    if (this.validate()) {
      this.injected.sessionStore.setNewPassword(
        this.oldPassword,
        this.newPassword,
        this.newPasswordConfirmation
      );
    }
  }

  validate() {
    const isSafe = this.newPassword.length >= 8 && this.newPassword.length <= 256;
    const isConfirmed = this.newPassword === this.newPasswordConfirmation;
    this.setState({
      isSafe: isSafe,
      isConfirmed: isConfirmed
    });
    return isConfirmed && isSafe;
  }

  get isValid() {
    return this.state.isConfirmed && this.state.isSafe;
  }

  @computed get segmentColor() {
    const { passwordState } = this.injected.sessionStore;
    if (passwordState === PasswordState.Success) {
      return 'green';
    }
    if (!this.isValid || passwordState === PasswordState.Error) {
      return 'red';
    }
    return 'blue';
  }

  render() {
    const { passwordState } = this.injected.sessionStore;
    const errorMessages: string[] = [];
    if (!this.state.isSafe) {
      errorMessages.push('The length of the new password must be between 8 and 256 characters.');
    }
    if (!this.state.isConfirmed) {
      errorMessages.push('The password confirmation is not equal to the new password.');
    }
    if (passwordState === PasswordState.Error) {
      errorMessages.push('Your current password was wrong. Please try again.');
    }

    const validPassword = errorMessages.length === 0;
    const newPasswordSet = passwordState === PasswordState.Success;

    return (
      <Segment
        color={this.segmentColor}
        style={{ minWidth: '350px' }}
      >
        <Header as="h2" content="Change your Password" />
        <Form
          onSubmit={() => this.setNewPassword()}
          error={!validPassword}
          success={newPasswordSet}
        >
          <Message
            error
            header="Errors"
            list={errorMessages}
            style={{ maxWidth: '320px' }}
          />
          <Message
            success
            header="Success"
            content="Password updated"
            style={{ maxWidth: '320px' }}
          />
          <Form.Group>
            <Form.Input
              type="password"
              label="Old password"
              placeholder="Old password"
              name="oldPassword"
              onChange={this.onChangePassword}
            />
          </Form.Group>
          <Form.Group>
            <Form.Input
              error={!this.state.isSafe}
              type="password"
              label="New password"
              placeholder="New password"
              name="newPassword"
              onChange={this.onChangePassword}
            />
          </Form.Group>
          <Form.Group>
            <Form.Input
              error={!this.state.isConfirmed}
              type="password"
              label="Confirm new password"
              placeholder="Confirmation"
              name="newPasswordConfirmation"
              onChange={this.onChangePassword}
            />
          </Form.Group>
          <Form.Button
            loading={passwordState === PasswordState.Waiting}
            content="Change Password"
            type="submit"
            disabled={!this.isValid}
          />
        </Form>
      </Segment>
    );
  }

}