import * as React from "react";
import { Provider } from 'mobx-react';
import rootStore from '../stores/root_store';

class DbSql extends React.Component {
  render () {
    return (
      <Provider
        rootStore={rootStore}
        sessionStore={rootStore.session}
      >
      <React.Fragment>
        <h1>DB SQL</h1>
        <p>{(new Date()).toLocaleString('de-CH')}</p>
      </React.Fragment>
      </Provider>
    );
  }
}

export default DbSql
