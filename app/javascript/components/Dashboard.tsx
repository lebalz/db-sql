import React, { Fragment } from 'react';
import { Header } from 'semantic-ui-react';
import Footer from './Navigation/Footer';
import NavBar from './Navigation/NavBar';
import SessionStore from '../stores/session_store';
import { RouterStore } from 'mobx-react-router';
import DbConnectionStore from '../stores/db_connection_store';
import { inject, observer } from 'mobx-react';
import DbConnectionOverview from './DbConnectionOverview';
import DbConnectionEdit from './DbConnectionEdit';
import _ from 'lodash';

interface InjectedProps {
  sessionStore: SessionStore;
  routerStore: RouterStore;
  dbConnectionStore: DbConnectionStore;
}

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
          <DbConnectionEdit />
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
        </main>
        <Footer />
      </Fragment>
    );
  }

}