import React, { Fragment } from 'react';
import { Header, Button } from 'semantic-ui-react';
import Footer from './Navigation/Footer';
import NavBar from './Navigation/NavBar';
import SessionStore from '../stores/session_store';
import { RouterStore } from 'mobx-react-router';
import DbServerStore from '../stores/db_server_store';
import { inject, observer } from 'mobx-react';
import DbServerOverview from './Dashboard/DbServerOverview';
import { TempDbServer as TempDbServerComponent } from './Dashboard/TempDbServer';
import _ from 'lodash';
import { TempDbServer, TempDbServerRole } from '../models/TempDbServer';
import { DbServer } from '../api/db_server';
import { DbType } from '../models/DbServer';

interface InjectedProps {
  sessionStore: SessionStore;
  routerStore: RouterStore;
  dbServerStore: DbServerStore;
}

const DEFAULT_DB_SERVER: DbServer = {
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  db_type: DbType.Psql,
  host: '',
  id: '',
  name: '',
  port: 5432,
  username: ''
};

@inject('sessionStore', 'routerStore', 'dbServerStore')
@observer
export default class Dashboard extends React.Component {
  get injected() {
    return this.props as InjectedProps;
  }

  render() {
    const { dbServers } = this.injected.dbServerStore;
    return (
      <Fragment>
        <header>
          <NavBar />
        </header>
        <main className="no-sidebar">
          <TempDbServerComponent />
          <Header as="h1" content="Welcome to DB SQL" />
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'flex-start',
              alignItems: 'baseline',
              width: 'inherit',
              flexWrap: 'wrap'
            }}
          >
            {_.sortBy(dbServers, ['name']).map((dbConnection) => {
              return (
                <DbServerOverview
                  key={dbConnection.id}
                  dbConnection={dbConnection}
                  style={{
                    flexBasis: '250px',
                    marginRight: '14px',
                    flexShrink: 0
                  }}
                />
              );
            })}
          </div>
          <Button
            icon="add"
            size="big"
            onClick={() => {
              const temp = new TempDbServer(
                DEFAULT_DB_SERVER,
                this.injected.dbServerStore,
                TempDbServerRole.Create,
                this.injected.dbServerStore.cancelToken
              );
              this.injected.dbServerStore.setTempDbServer(temp);
            }}
          />
        </main>
        <Footer />
      </Fragment>
    );
  }
}
