import React, { Fragment } from 'react';
import { Header, Button } from 'semantic-ui-react';
import Footer from './Navigation/Footer';
import NavBar from './Navigation/NavBar';
import SessionStore from '../stores/session_store';
import { RouterStore } from 'mobx-react-router';
import DbConnectionStore from '../stores/db_connection_store';
import { inject, observer } from 'mobx-react';
import DbConnectionOverview from './Dashboard/DbConnectionOverview';
import { TempDbConnection as TempDbConnectionComponent } from './Dashboard/TempDbConnection';
import _ from 'lodash';
import { TempDbConnection, TempDbConnectionRole } from '../models/TempDbConnection';
import { DbConnection as DbConnectionProps } from '../api/db_connection';
import { DbType } from '../models/DbConnection';

interface InjectedProps {
  sessionStore: SessionStore;
  routerStore: RouterStore;
  dbConnectionStore: DbConnectionStore;
}

const DEFAULT_DB_CONNECTION: DbConnectionProps = {
  created_at: (new Date()).toISOString(),
  updated_at: (new Date()).toISOString(),
  db_type: DbType.Psql,
  host: '',
  id: '',
  name: '',
  port: 5432,
  username: ''
};

@inject('sessionStore', 'routerStore', 'dbConnectionStore')
@observer
export default class Dashboard extends React.Component {

  get injected() {
    return this.props as InjectedProps;
  }

  render() {
    const { dbConnections } = this.injected.dbConnectionStore;
    return (
      <Fragment>
        <header>
          <NavBar />
        </header>
        <main className="no-sidebar">
          <TempDbConnectionComponent />
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
            {
              _.sortBy(dbConnections, ['name']).map((dbConnection) => {
                return (
                  <DbConnectionOverview
                    key={dbConnection.id}
                    dbConnection={dbConnection}
                    style={{
                      flexBasis: '250px',
                      marginRight: '14px',
                      flexShrink: 0
                    }}
                  />
                );
              })
            }
          </div>
          <Button
            icon="add"
            size="big"
            onClick={() => {
              const temp = new TempDbConnection(DEFAULT_DB_CONNECTION, TempDbConnectionRole.Create)
              this.injected.dbConnectionStore.tempDbConnection = temp;
            }}
          />
        </main>
        <Footer />
      </Fragment>
    );
  }

}