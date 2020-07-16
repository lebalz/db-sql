import 'rc-slider/assets/index.css';
import React from 'react';
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
import About from '../components/About';
import Slider from '../shared/Slider';

const MIN_SIDEBAR_WIDTH = 50;
const GRID_COLUMN_GAP_WIDTH = 1;
const DEFAULT_SIDEBAR_WIDTH = 280;

const AppContent = observer(() => (
  <Provider
    rootStore={rootStore}
    sessionStore={rootStore.session}
    routerStore={rootStore.routing}
    userStore={rootStore.user}
    dbServerStore={rootStore.dbServer}
    statusStore={rootStore.statusStore}
    viewStateStore={rootStore.viewStateStore}
    schemaQueryStore={rootStore.schemaQueryStore}
    groupStore={rootStore.groupStore}
    sqlQueryStore={rootStore.sqlQueryStore}
  >
    <Router history={rootStore.session.history}>
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/about" component={About} />
        <Route path="/connections/:id/:db_name?" component={DbServer} />
        <Route path="/profile/:part/:id?" component={Profile} />
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
  state: { leftShare: number } = { leftShare: DEFAULT_SIDEBAR_WIDTH };
  onResize = (leftShare: number) => {
    this.setState({ leftShare: leftShare });
  };
  render() {
    return (
      <div id="db-sql" style={{ gridTemplateColumns: `${this.state.leftShare}px 2px auto` }}>
        <AppContent />
        <Slider
          id="sidebar-divider"
          direction="horizontal"
          onChange={this.onResize}
          defaultSize={DEFAULT_SIDEBAR_WIDTH}
          shift={-GRID_COLUMN_GAP_WIDTH}
          minSize={MIN_SIDEBAR_WIDTH}
          collapseDirecrtion="left"
          hideIcon
        />
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('app'));
