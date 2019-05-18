import React, { Fragment } from 'react';
import { Header, Button, Segment, Menu, Icon } from 'semantic-ui-react';
import Footer from './Navigation/Footer';
import NavBar from './Navigation/NavBar';
import { inject } from 'mobx-react';
import SessionStore from '../stores/session_store';
import { Route } from 'react-router';


interface InjectedProps {
  sessionStore: SessionStore;
}


@inject('sessionStore')
export default class Profile extends React.Component {

  get injected() {
    return this.props as InjectedProps;
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
            style={{ width: '350px', alignSelf: 'center' }}
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
        </main>
        <Footer />
      </Fragment>
    );
  }

}