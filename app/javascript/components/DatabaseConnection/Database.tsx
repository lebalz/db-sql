import React, { Fragment } from 'react';
import { Button, Menu, Icon, Segment } from 'semantic-ui-react';
import DbConnectionStore from '../../stores/db_connection_store';
import { inject, observer } from 'mobx-react';
import _ from 'lodash';
import { RequestState } from '../../stores/session_store';
import SqlEditor from './SqlEditor';
import SqlResult from './SqlResult';

interface InjectedProps {
  dbConnectionStore: DbConnectionStore;
}

@inject('dbConnectionStore')
@observer
export default class Database extends React.Component {
  get injected() {
    return this.props as InjectedProps;
  }

  render() {
    const { dbConnectionStore } = this.injected;
    const { loadedConnections, activeConnection, queryState } = dbConnectionStore;
    const loadedDbs = activeConnection
      ? activeConnection.databases.filter((db) => db.isLoaded)
      : [];
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
            {loadedDbs.map((db, i) => {
              return (
                <Menu.Item
                  name={db.name}
                  active={!!activeConnection && activeConnection.activeDatabase === db}
                  key={`db-${i}`}
                  onClick={() => {
                    if (activeConnection) {
                      activeConnection.activeDatabase = db;
                    }
                  }}
                />
              );
            })}
          </Menu>
          <Segment attached="bottom">
            <SqlEditor />
            <Button
              positive
              disabled={queryState === RequestState.Waiting}
              loading={queryState === RequestState.Waiting}
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
