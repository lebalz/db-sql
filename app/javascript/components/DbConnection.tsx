import React, { Fragment } from 'react';
import Footer from './Navigation/Footer';
import NavBar from './Navigation/NavBar';
import SessionStore from '../stores/session_store';
import { RouterStore } from 'mobx-react-router';
import DbConnectionStore from '../stores/db_connection_store';
import { inject, observer } from 'mobx-react';
import _ from 'lodash';
import Database from './DatabaseConnection/Database';
import DatabaseSchemaTree from './DatabaseConnection/DatabaseSchemaTree/DatabaseSchemaTree';
import { RouteComponentProps } from 'react-router';
import { reaction, computed, IReactionDisposer } from 'mobx';

interface MatchParams {
  id: string;
}

interface DbConnectionProps extends RouteComponentProps<MatchParams> {}

interface InjectedProps extends DbConnectionProps {
  sessionStore: SessionStore;
  routerStore: RouterStore;
  dbConnectionStore: DbConnectionStore;
}

@inject('sessionStore', 'routerStore', 'dbConnectionStore')
@observer
export default class DbConnection extends React.Component<DbConnectionProps> {
  loadDisposer: IReactionDisposer;
  constructor(props: DbConnectionProps) {
    super(props);
    this.loadDisposer = reaction(
      () => this.id,
      (id) => {
        this.injected.dbConnectionStore.setActiveConnection(id);
      }
    );
  }
  get injected() {
    return this.props as InjectedProps;
  }

  componentDidMount() {
    this.injected.dbConnectionStore.setActiveConnection(this.id);
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
