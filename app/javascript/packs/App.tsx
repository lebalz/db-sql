import React, { Fragment } from 'react';
import ReactDOM from 'react-dom';
import { Provider, observer } from 'mobx-react';
import rootStore from '../stores/root_store';
import Login from '../views/Login';
import { Router, Route, Redirect, Switch } from 'react-router';
import Dashboard from '../components/Dashboard';
import Profile from '../components/Profile';
import ResetPassword from '../views/ResetPassword';
import ActivateAccount from '../views/ActivateAccount';
import DbServer from '../components/DbServer';

const AppContent = observer(() => (
  <Provider
    rootStore={rootStore}
    sessionStore={rootStore.session}
    routerStore={rootStore.routing}
    userStore={rootStore.user}
    dbServerStore={rootStore.dbServer}
  >
    <Router history={rootStore.session.history}>
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/connections/:id/:db_id?" component={DbServer} />
        <Route path="/profile/:part" component={Profile} />
        <Route path="/users/:id/reset_password" component={ResetPassword} />
        <Route path="/users/:id/activate" component={ActivateAccount} />
        <Redirect from="/" exact to="/dashboard" />
        <Redirect to="/dashboard" />
      </Switch>
    </Router>
  </Provider>
));

@observer
class App extends React.Component {
  render() {
    return <AppContent />;
  }
}

ReactDOM.render(<App />, document.getElementById('app'));
