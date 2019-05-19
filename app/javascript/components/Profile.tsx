import React, { Fragment } from 'react';
import { Segment, Menu, Icon, Accordion, InputOnChangeData } from 'semantic-ui-react';
import NavBar from './Navigation/NavBar';
import { inject } from 'mobx-react';
import SessionStore from '../stores/session_store';
import UpdatePasswordForm from './UpdatePasswordForm';


interface InjectedProps {
  sessionStore: SessionStore;
}

@inject('sessionStore')
export default class Profile extends React.Component {
  state = {
    editPassword: false
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
    this.forceUpdate();
  }

  setNewPassword() {
    this.injected.sessionStore.setNewPassword(
      this.oldPassword,
      this.newPassword,
      this.newPasswordConfirmation
    );
  }

  render() {
    const { currentUser } = this.injected.sessionStore;
    return (
      <Fragment>
        <header>
          <NavBar />
        </header>
        <main className="no-sidebar">
          <Segment
            piled
            className="flex-list"
            style={{ width: '350px' }}
          >
            <div className="flex-list-item">
              <Menu.Item>
                <Icon name="mail" />
                Mail
            </Menu.Item>
              {currentUser.email}
            </div>
            <div className="flex-list-item">
              <Menu.Item>
                <Icon name="time" />
                Member Since
              </Menu.Item>
              {currentUser.created_at.substr(0, 10)}
            </div>
          </Segment>
          <Accordion>
            <Accordion.Title
              active={this.state.editPassword}
              onClick={() => this.setState({ editPassword: !this.state.editPassword })}
            >
              <Icon name="key" />
              Change Password
            </Accordion.Title>
            <Accordion.Content active={this.state.editPassword}>
              <UpdatePasswordForm />
            </Accordion.Content>
          </Accordion>
        </main>
      </Fragment>
    );
  }

}