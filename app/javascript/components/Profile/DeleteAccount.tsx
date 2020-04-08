import React from 'react';
import { InputOnChangeData, Message, Segment, Form, Header } from 'semantic-ui-react';
import { inject, observer } from 'mobx-react';
import SessionStore, { RequestState } from '../../stores/session_store';

interface InjectedProps {
  sessionStore: SessionStore;
}

@inject('sessionStore')
@observer
export default class DeleteAccount extends React.Component {
  private password: string = '';

  get injected() {
    return this.props as InjectedProps;
  }

  onChangePassword = (event: React.ChangeEvent<HTMLInputElement>, data: InputOnChangeData) => {
    this.password = event.target.value;
  };

  deleteAccount() {
    this.injected.sessionStore.deleteAccount(this.password);
  }

  render() {
    const { passwordState } = this.injected.sessionStore;
    return (
      <Segment color="red" style={{ minWidth: '350px' }}>
        <Header as="h2" content="Parmanently delete your Account." />
        <Message info icon="info" content="All your data is deleted permanently and cannot be restored." />
        <Form onSubmit={() => this.deleteAccount()} error={passwordState === RequestState.Error}>
          <Message
            error
            header="Errors"
            content="The Password was not correct."
            style={{ maxWidth: '320px' }}
          />
          <Form.Group>
            <Form.Input
              type="password"
              label="Password confirmation"
              placeholder="Password"
              name="password"
              onChange={this.onChangePassword}
            />
          </Form.Group>
          <Form.Button
            loading={passwordState === RequestState.Waiting}
            content="Delete Account"
            type="submit"
          />
        </Form>
      </Segment>
    );
  }
}
