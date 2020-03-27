import React, { Fragment } from 'react';
import { Button, Menu, Icon, Segment } from 'semantic-ui-react';
import DbConnectionStore from '../../stores/db_connection_store';
import { inject, observer } from 'mobx-react';
import _ from 'lodash';
import SqlEditor from './SqlEditor';
import SqlResult from './SqlResult';
import { action } from 'mobx';
import { default as DatabaseModel } from '../../models/Database';
import Query from '../../models/Query';
import { REST } from '../../declarations/REST';

interface InjectedProps {
  dbConnectionStore: DbConnectionStore;
}

@inject('dbConnectionStore')
@observer
export default class Database extends React.Component {
  get injected() {
    return this.props as InjectedProps;
  }

  @action
  changeQueryTab(database: DatabaseModel, query: Query) {
    const { dbConnectionStore } = this.injected;
    const { activeConnection } = dbConnectionStore;
    if (activeConnection === database.dbConnection) {
      database.dbConnection.activeDatabase = database;
      query.setActive();
    }
  }

  render() {
    const { dbConnectionStore } = this.injected;
    const { loadedConnections, activeConnection } = dbConnectionStore;
    if (!activeConnection || activeConnection.isClosed) {
      return null;
    }

    const activeQuery = activeConnection.activeDatabase?.activeQuery;

    const loadedDbs = activeConnection.databases.filter((db) => db.isLoaded);
    return (
      <Fragment>
        <Menu stackable secondary compact size="mini" color="teal">
          {loadedConnections.map((conn, i) => {
            return (
              <Menu.Item
                key={i}
                onClick={() => (dbConnectionStore.activeConnection = conn)}
                active={activeConnection === conn}
              >
                <Icon name="plug" />
                {conn.name}
                {activeConnection === conn && (
                  <Button
                    icon="close"
                    onClick={() => conn.close()}
                    floated="right"
                    style={{
                      padding: '2px',
                      marginLeft: '4px',
                      marginRight: '-4px'
                    }}
                  />
                )}
              </Menu.Item>
            );
          })}
        </Menu>
        <Segment>
          <Menu attached="top" tabular size="mini">
            {loadedDbs.map((db) => {
              return db.queries.map((query) => {
                return (
                  <Menu.Item
                    active={query.isActive}
                    key={`db-${query.name}`}
                    onClick={() => this.changeQueryTab(db, query)}
                  >
                    {db.name}
                    {query.isActive && (
                      <Button
                        icon="close"
                        onClick={() => query.close()}
                        floated="right"
                        style={{
                          padding: '2px',
                          marginLeft: '4px',
                          marginRight: '-4px'
                        }}
                      />
                    )}
                  </Menu.Item>
                );
              });
            })}
          </Menu>
          <Segment attached="bottom">
            <SqlEditor />
            <Button
              positive
              disabled={activeQuery?.requestState === REST.Requested}
              loading={activeQuery?.requestState === REST.Requested}
              onClick={() => this.injected.dbConnectionStore.executeQuery()}
            >
              Query
            </Button>
            <SqlResult />
          </Segment>
        </Segment>
      </Fragment>
    );
  }
}
