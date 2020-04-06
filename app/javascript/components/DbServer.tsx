import React, { Fragment } from 'react';
import Footer from './Navigation/Footer';
import NavBar from './Navigation/NavBar';
import SessionStore from '../stores/session_store';
import { RouterStore } from 'mobx-react-router';
import DbServerStore from '../stores/db_server_store';
import { inject, observer } from 'mobx-react';
import _ from 'lodash';
import Database from './DatabaseServer/Database';
import DatabaseSchemaTree from './DatabaseServer/DatabaseSchemaTree/DatabaseSchemaTree';
import { RouteComponentProps, Switch } from 'react-router';
import { reaction, computed, IReactionDisposer } from 'mobx';
import DbServerIndex from './DatabaseServer/DbServerIndex';
import { Route } from 'react-router-dom';

interface MatchParams {
  id: string;
  db_name?: string;
}

interface DbConnectionProps extends RouteComponentProps<MatchParams> {}

interface InjectedProps extends DbConnectionProps {
  sessionStore: SessionStore;
  routerStore: RouterStore;
  dbServerStore: DbServerStore;
}

@inject('sessionStore', 'routerStore', 'dbServerStore')
@observer
export default class DbServer extends React.Component<DbConnectionProps> {
  loadDisposer: IReactionDisposer;
  tableDisposer: IReactionDisposer;
  constructor(props: DbConnectionProps) {
    super(props);
    this.loadDisposer = reaction(
      () => this.id,
      (id) => {
        this.injected.dbServerStore.setActiveDbServer(id);
      }
    );
    this.tableDisposer = reaction(
      () => this.db_name,
      (db_name) => {
        if (db_name) {
          this.injected.dbServerStore.activeDbServer?.setActiveDatabase(db_name);
        }
      }
    );
  }
  get injected() {
    return this.props as InjectedProps;
  }

  componentDidMount() {
    this.injected.dbServerStore.setActiveDbServer(this.id);
    if (this.db_name) {
      this.injected.dbServerStore.setActiveDatabase(this.id, this.db_name);
    }
  }

  componentWillUnmount() {
    this.loadDisposer();
    this.tableDisposer();
  }

  @computed
  get id() {
    return this.props.match.params.id;
  }

  @computed
  get db_name() {
    return this.props.match.params.db_name;
  }

  render() {
    return (
      <Fragment>
        <header>
          <NavBar />
        </header>
        <div id="sidebar">
          <Route path="/connections/:id/:db_name?" component={DatabaseSchemaTree} />
        </div>
        <main style={{ paddingTop: '0em', paddingLeft: '0.2em' }}>
          <DbServerIndex />
          <Database />
        </main>
        <Footer />
      </Fragment>
    );
  }
}
