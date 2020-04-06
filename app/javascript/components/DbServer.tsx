import React, { Fragment } from 'react';
import Footer from './Navigation/Footer';
import NavBar from './Navigation/NavBar';
import SessionStore from '../stores/session_store';
import { RouterStore } from 'mobx-react-router';
import DbServerStore, { LoadState } from '../stores/db_server_store';
import { inject, observer } from 'mobx-react';
import _ from 'lodash';
import DatabaseSchemaTree from './DatabaseServer/DatabaseSchemaTree/DatabaseSchemaTree';
import { RouteComponentProps } from 'react-router';
import { reaction, computed, IReactionDisposer } from 'mobx';
import DbServerIndex from './DatabaseServer/DbServerIndex';
import { Route } from 'react-router-dom';
import { Dimmer, Loader, Segment } from 'semantic-ui-react';
import QueryIndex from './DatabaseServer/QueryIndex';
import Query from './DatabaseServer/Query';


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
      () => this.dbName,
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
    if (this.dbName) {
      this.injected.dbServerStore.setActiveDatabase(this.id, this.dbName);
    }
    console.log('DbServer component did mount');
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
  get dbName() {
    return this.props.match.params.db_name;
  }

  render() {
    const query = this.injected.dbServerStore.activeDbServer?.activeDatabase?.activeQuery;
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
          <Segment>
            <QueryIndex
              queries={this.injected.dbServerStore.activeDbServer?.queries ?? []}
            />
            {query && <Query query={query} />}
          </Segment>
        </main>
        <Dimmer
          active={this.injected.dbServerStore.dbIndexLoadState === LoadState.Loading}
        >
          <Loader indeterminate content="Loading Databases" />
        </Dimmer>
        <Footer />
      </Fragment>
    );
  }
}
