import React from 'react';
import { inject } from 'mobx-react';
import SessionStore from '../../stores/session_store';
import { Button } from 'semantic-ui-react';

interface InjectedProps {
  sessionStore: SessionStore;
}

@inject('sessionStore')
export default class Logout extends React.Component {
  get injected() {
    return this.props as InjectedProps;
  }
  render() {
    return (
      <Button
        compact
        content="Logout"
        onClick={() => this.injected.sessionStore.logout()}
      />
    );
  }
}
