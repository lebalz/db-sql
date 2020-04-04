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
import { RouteComponentProps } from 'react-router';
import { reaction, computed, IReactionDisposer } from 'mobx';

interface MatchParams {
  id: string;
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
  constructor(props: DbConnectionProps) {
    super(props);
    this.loadDisposer = reaction(
      () => this.id,
      (id) => {
        this.injected.dbServerStore.setActiveDbServer(id);
      }
    );
  }
  get injected() {
    return this.props as InjectedProps;
  }

  componentDidMount() {
    this.injected.dbServerStore.setActiveDbServer(this.id);
  }
  componentWillUnmount() {
    this.loadDisposer();
  }

  @computed
  get id() {
    return this.props.match.params.id;
  }

  render() {
    return (
      <Fragment>
        <header>
          <NavBar />
        </header>
        <div id="sidebar">
          <DatabaseSchemaTree />
        </div>
        <main style={{ paddingTop: '0em', paddingLeft: '0.2em' }}>
          <Database />
        </main>
        <Footer />
      </Fragment>
    );
  }
}
