import React, { Fragment } from 'react';
import NavBar from './Navigation/NavBar';
import SessionStore from '../stores/session_store';
import { RouterStore } from 'mobx-react-router';
import DbServerStore, { LoadState } from '../stores/db_server_store';
import { inject, observer } from 'mobx-react';
import _ from 'lodash';
import DatabaseSchemaTree from './Workbench/DatabaseSchemaTree/DatabaseSchemaTree';
import { RouteComponentProps } from 'react-router';
import { reaction, computed, IReactionDisposer } from 'mobx';
import DbServerIndex from './Workbench/DbServerIndex';
import { Dimmer, Loader, Segment, Button, Header, Icon } from 'semantic-ui-react';
import EditorIndex from './Workbench/EditorIndex';
import QueryEditor from './Workbench/QueryEditor/QueryEditor';
import QueryIndex from './Workbench/QueryIndex';

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
export default class Workbench extends React.Component<DbConnectionProps> {
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
    const { db_name } = this.props.match.params;
    if (db_name) {
      return db_name;
    }
    return this.injected.dbServerStore.activeDbServer?.defaultDatabaseName;
  }

  render() {
    const { dbServerStore } = this.injected;
    const { activeDbServer } = dbServerStore;

    const connectionError = dbServerStore.find(this.id)?.connectionError;
    const connectionSuccess = !connectionError;

    const query = activeDbServer?.activeDatabase?.activeQuery;
    return (
      <Fragment>
        <header>
          <NavBar />
        </header>
        <div id="sidebar">
          <DatabaseSchemaTree />
        </div>
        <main style={{ paddingTop: '0em', paddingLeft: '0.2em' }}>
          <DbServerIndex activeId={this.id} />
          {connectionSuccess ? (
            <Fragment>
              <Segment>
                <EditorIndex editors={activeDbServer?.queries ?? []} />
                {activeDbServer && activeDbServer.activeDatabaseName && (
                  <QueryIndex dbServerId={activeDbServer.id} dbName={activeDbServer.activeDatabaseName} />
                )}
                {query && <QueryEditor query={query} />}
              </Segment>
            </Fragment>
          ) : (
            <Segment placeholder>
              <Header icon>
                <Icon name="close" color="red" />
                Error connecting to this database server
              </Header>
              <Segment color="red">
                <code>{connectionError}</code>
              </Segment>
              <Button
                size="mini"
                content="Edit this connection"
                onClick={() => this.injected.dbServerStore.editDbServer(this.id)}
              />
            </Segment>
          )}
        </main>
        <Dimmer active={dbServerStore.dbIndexLoadState === LoadState.Loading}>
          <Loader indeterminate content="Loading Databases" />
        </Dimmer>
      </Fragment>
    );
  }
}
