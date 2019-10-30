import React, { Fragment } from 'react';
import { Button, Menu, Icon, Segment, Table } from 'semantic-ui-react';
import DbConnectionStore from '../../stores/db_connection_store';
import { inject, observer } from 'mobx-react';
import _ from 'lodash';
import { query as fetchQuery } from '../../api/db_connection';

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
    const { loadedConnections, activeConnection } = dbConnectionStore;
    const loadedDbs = activeConnection ? activeConnection.databases.filter(db => db.isLoaded) : [];
    return (
      <Fragment>
        <Menu
          stackable
          secondary
          compact
          size="mini"
          color="teal"
        >
          {
            loadedConnections.map((conn, i) => {
              return (
                <Menu.Item
                  key={i}
                  onClick={() => dbConnectionStore.activeConnection = conn}
                  active={activeConnection === conn}
                >
                  <Icon name="plug" />
                  {conn.name}
                  {
                    activeConnection === conn &&
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
                  }
                </Menu.Item>
              );
            })
          }
        </Menu>
        <Segment>
          <Menu attached="top" tabular size="mini">
            {loadedDbs.map((db, i) => {
              return <Menu.Item
                name={db.name}
                active={!!activeConnection && activeConnection.activeDatabase === db}
                key={i}
                onClick={() => {
                  if (activeConnection) {
                    activeConnection.activeDatabase = db;
                  }
                }}
              />;
            })}
          </Menu>
          <Segment attached="bottom">
            <textarea
              id="query"
              style={{ width: '100%', height: '200px' }}
            />
            <Button
              onClick={
                () => {
                  if (!activeConnection || !activeConnection.activeDatabase) {
                    return;
                  }
                  const conn = activeConnection.activeDatabase;
                  const query = (document.getElementById('query') as any).value;
                  fetchQuery(
                    activeConnection.id,
                    conn.name,
                    query
                  ).then(({ data }) => {
                    conn.result = data;
                    console.log(data);
                  });
                }
              }
            >
              Query
            </Button>
            {
              activeConnection && activeConnection.activeDatabase && activeConnection.activeDatabase.result &&
              <Table celled>
                <Table.Header>
                  <Table.Row>
                    {Object.keys(activeConnection.activeDatabase.result[0] || []).map((val, i) => {
                      return (
                        <Table.HeaderCell key={i}>
                          {val}
                        </Table.HeaderCell>
                      );
                    })}
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {
                    activeConnection.activeDatabase.result.map((val, i) => {
                      return (
                        <Table.Row key={i}>
                          {
                            Object.values(val).map((ds, j) => {
                              return (
                                <Table.Cell key={j}>
                                  {ds}
                                </Table.Cell>
                              );
                            })
                          }
                        </Table.Row>
                      );
                    })
                  }
                </Table.Body>
              </Table>
            }
          </Segment>
        </Segment>
      </Fragment>
    );
  }

}