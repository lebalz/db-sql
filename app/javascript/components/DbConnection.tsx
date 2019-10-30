import React, { Fragment } from 'react';
import Footer from './Navigation/Footer';
import NavBar from './Navigation/NavBar';
import SessionStore from '../stores/session_store';
import { RouterStore } from 'mobx-react-router';
import DbConnectionStore from '../stores/db_connection_store';
import { inject, observer } from 'mobx-react';
import _ from 'lodash';
import Database from './DatabaseConnection/Database';
import DatabaseStructure from './DatabaseConnection/DatabaseStructure';

interface InjectedProps {
  sessionStore: SessionStore;
  routerStore: RouterStore;
  dbConnectionStore: DbConnectionStore;
}
@inject('sessionStore', 'routerStore', 'dbConnectionStore')
@observer
export default class DbConnection extends React.Component {

  get injected() {
    return this.props as InjectedProps;
  }

  render() {
    return (
      <Fragment>
        <header>
          <NavBar />
        </header>
        <div id="sidebar">
          <DatabaseStructure />
        </div>
        <main style={{ paddingTop: '0em', paddingLeft: '0.2em' }}>
          <Database />
        </main>
        <Footer />
      </Fragment >
    );
  }
}
