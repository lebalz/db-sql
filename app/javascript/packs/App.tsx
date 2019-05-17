import React from "react";
import ReactDOM from "react-dom";
import { Provider, observer } from 'mobx-react';
import rootStore from '../stores/root_store';
import DbSql from "../components/DbSql";

@observer
class App extends React.Component {
  render() {
    return (
      <Provider
        rootStore={rootStore}
        sessionStore={rootStore.session}
      >
        <DbSql />
      </Provider>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('app'));