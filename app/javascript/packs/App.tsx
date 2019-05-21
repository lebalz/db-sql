import React, { Fragment } from 'react';
import ReactDOM from 'react-dom';
import { Provider, observer } from 'mobx-react';
import rootStore from '../stores/root_store';
import Login from '../views/Login';
import { Router, Route, Redirect, Switch } from 'react-router';
import Dashboard from '../components/Dashboard';
import Profile from '../components/Profile';

const AppContent = observer(({ loggedIn }: { loggedIn: boolean }) => (
  <Provider
    rootStore={rootStore}
    sessionStore={rootStore.session}
    routerStore={rootStore.routing}
  >
    <Router history={rootStore.session.history}>
      <Fragment>
        <Switch>
          <Route path="/login" component={Login} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/profile" component={Profile} />
          <Redirect from="/" exact to="/dashboard" />
          <Redirect to="/dashboard" />
        </Switch>
      </Fragment>
    </Router>
  </Provider>
));

@observer
class App extends React.Component {
  render() {
    return <AppContent loggedIn={rootStore.session.isLoggedIn} />;
  }
}

ReactDOM.render(<App />, document.getElementById('app'));
