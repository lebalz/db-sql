import React, { Fragment } from 'react';
import { Header, Button, Menu, Icon, List } from 'semantic-ui-react';
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

@inject('sessionStore', 'routerStore', 'dbConnectionStore')
@observer
export default class Connections extends React.Component {

  get injected() {
    return this.props as InjectedProps;
  }

  render() {
    const { dbConnectionStore } = this.injected;
    const { loadedConnections, activeConnection } = dbConnectionStore;
    return (
      <Fragment>
        <header>
          <NavBar />
        </header>
        <div id="sidebar">
          <Header as="h3" content="Databases" />
          <List
            style={{
              margin: '0 0 0 1em',
              padding: '0em',
              overflowY: 'auto'
            }}
          >
            {
              activeConnection && activeConnection.databases.map((db, i) => {
                return (
                  <List.Item
                    as="a"
                    key={`db-${i}`}
                    onClick={() => db.load()}
                  >
                    <List.Icon name="database" />
                    <List.Content>
                      {db.name}
                    </List.Content>
                    {db.isLoaded &&
                      <List.List>
                        {db.tables.map((table, ii) => {
                          return (
                            <List.Item
                              as="a"
                              key={`db-${i}-${ii}`}
                              onClick={() => table.load()}
                            >
                              <List.Icon name="table" />
                              <List.Content>
                                {table.name}
                              </List.Content>
                              {table.isLoaded &&
                                <List.List>
                                  {table.columns.map((column, iii) => {
                                    return (
                                      <List.Item
                                        as="a"
                                        key={`db-${i}-${ii}-${iii}`}
                                      >
                                        <List.Icon name="columns" />
                                        <List.Content>
                                          {column}
                                        </List.Content>
                                      </List.Item>
                                    );
                                  })
                                  }
                                </List.List>
                              }
                            </List.Item>
                          );
                        })
                        }
                      </List.List>
                    }
                  </List.Item>
                );
              })
            }
          </List>
        </div>
        <main style={{ paddingTop: '0em', paddingLeft: '0.2em' }}>
          <Menu stackable secondary compact size="mini" color="teal">
            {
              loadedConnections.map((conn, i) => {
                return (
                  <Menu.Item
                    key={`conn-${i}`}
                    onClick={() => dbConnectionStore.activeConnection = conn}
                    active={activeConnection === conn}
                  >
                    <Icon name="plug" />
                    {conn.name}
                    {
                      activeConnection === conn &&
                      <Button
                        icon="close"
                        onClick={() => conn.isLoaded = false}
                        floated="right"
                        style={{
                          padding: '2px',
                          marginLeft: '4px',
                          marginRight: '-4px'
                        }}
                      />
                    }
                  </Menu.Item>
                );
              })
            }
          </Menu>
        </main>
        <Footer />
      </Fragment>
    );
  }

}