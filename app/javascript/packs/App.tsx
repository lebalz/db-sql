import React, { Fragment } from 'react';
import ReactDOM from 'react-dom';
import { Provider, observer } from 'mobx-react';
import rootStore from '../stores/root_store';
import DbSql from '../components/DbSql';
import Login from '../views/Login';
import { createBrowserHistory } from 'history';
import { syncHistoryWithStore } from 'mobx-react-router';
import { Router } from 'react-router';

const AppContent = observer(({ loggedIn }: { loggedIn: boolean }) => (
  <Provider
    rootStore={rootStore}
    sessionStore={rootStore.session}
  >
    <Router history={history}>
      {
        loggedIn
          ? <DbSql />
          : <Login />
      }
    </Router>
  </Provider>
));

const browserHistory = createBrowserHistory();
const history = syncHistoryWithStore(browserHistory, rootStore.routing);

@observer
class App extends React.Component {
  render() {
    return <AppContent loggedIn={rootStore.session.isLoggedIn} />;
  }
}

ReactDOM.render(<App />, document.getElementById('app'));
