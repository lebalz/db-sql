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
import About from '../components/About';
import * as dotenv from "dotenv";

dotenv.config();

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
  >
    <Router history={rootStore.session.history}>
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/about" component={About} />
        <Route path="/connections/:id/:db_name?" component={DbServer} />
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
  state: { mouseDown: boolean; leftShare: number } = { mouseDown: false, leftShare: DEFAULT_SIDEBAR_WIDTH };

  componentDidMount() {
    document.addEventListener('mouseup', this.onMouseUp);
    document.addEventListener('mousemove', this.onMouseMove);
  }

  componentWillUnmount() {
    document.removeEventListener('mouseup', this.onMouseUp);
    document.removeEventListener('mousemove', this.onMouseMove);
  }

  onMouseDown = () => {
    this.setState({ mouseDown: true });
  };

  onMouseUp = () => {
    this.setState({ mouseDown: false });
  };

  onMouseMove = (e: MouseEvent) => {
    if (this.state.mouseDown) {
      e.preventDefault();

      const divider = document.getElementById('divider');

      if (!divider) {
        return console.log('Resizing not possible due to missing dom elements');
      }

      const leftShare = Math.max(
        Math.max(0, e.clientX - GRID_COLUMN_GAP_WIDTH),
        MIN_SIDEBAR_WIDTH
      );

      this.setState({ leftShare: leftShare });
    }
  };

  render() {
    return (
      <div id="db-sql" style={{ gridTemplateColumns: `${this.state.leftShare}px 2px auto`}}>
        <AppContent />
        <div id="divider" onMouseDown={this.onMouseDown} />
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('app'));
