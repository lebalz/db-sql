import React, { Fragment } from 'react';
import { Button, Menu, Icon, Segment } from 'semantic-ui-react';
import DbServerStore from '../../stores/db_server_store';
import { inject, observer } from 'mobx-react';
import _ from 'lodash';
import SqlEditor from './SqlEditor';
import SqlResults from './SqlResults';
import { action } from 'mobx';
import { default as DatabaseModel } from '../../models/Database';
import Query from '../../models/Query';
import { REST } from '../../declarations/REST';
import { RouterStore } from 'mobx-react-router';

interface Props {}

interface InjectedProps extends Props {
  dbServerStore: DbServerStore;
  routerStore: RouterStore;
}

@inject('dbServerStore', 'routerStore')
@observer
export default class Database extends React.Component<Props> {
  get injected() {
    return this.props as InjectedProps;
  }

  @action
  changeQueryTab(database: DatabaseModel, query: Query) {
    const { dbServerStore } = this.injected;
    const { activeConnection } = dbServerStore;
    if (activeConnection === database.dbConnection) {
      database.dbConnection.activeDatabase = database;
      query.setActive();
    }
  }

  render() {
    const { dbServerStore } = this.injected;
    // const activeConnection = dbServerStore.findDbConnection(this.props.id);
    const { loadedConnections, activeConnection } = dbServerStore;
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
                onClick={() => this.injected.routerStore.push(`./${conn.id}`)}
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
          <Segment
            attached="bottom"
            style={{ padding: '0.5em 0 0 0', marginBottom: '3em' }}
          >
            <SqlEditor />
            <Button
              floated="right"
              positive
              disabled={activeQuery?.requestState === REST.Requested}
              loading={activeQuery?.requestState === REST.Requested}
              onClick={() => this.injected.dbServerStore.executeQuery()}
            >
              Query
            </Button>
          </Segment>
          <SqlResults />
        </Segment>
      </Fragment>
    );
  }
}
