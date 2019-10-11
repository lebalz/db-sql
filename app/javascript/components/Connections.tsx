import React, { Fragment } from 'react';
import { Header, Button, Menu, Icon, List } from 'semantic-ui-react';
import Footer from './Navigation/Footer';
import NavBar from './Navigation/NavBar';
import SessionStore from '../stores/session_store';
import { RouterStore } from 'mobx-react-router';
import DbConnectionStore from '../stores/db_connection_store';
import { inject, observer } from 'mobx-react';
import _ from 'lodash';
import Database from '../models/Database';
import DbTable from '../models/DbTable';
import { computed } from 'mobx';
import DbColumn from '../models/DbColumn';

interface InjectedProps {
  sessionStore: SessionStore;
  routerStore: RouterStore;
  dbConnectionStore: DbConnectionStore;
}

type MenuItemDb = { kind: 'db', obj: Database }
  | { kind: 'table', obj: DbTable }
  | { kind: 'column', obj: DbColumn };

@inject('sessionStore', 'routerStore', 'dbConnectionStore')
@observer
export default class Connections extends React.Component {

  get injected() {
    return this.props as InjectedProps;
  }

  handleDbClicked = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, db: Database) => {
    db.toggleShow();
    e.preventDefault();
    e.stopPropagation();
  }
  handleTableClicked = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, db: DbTable) => {
    db.toggleShow();
    e.preventDefault();
    e.stopPropagation();
  }

  @computed get menuItems(): MenuItemDb[] {
    const { dbConnectionStore } = this.injected;
    const { activeConnection } = dbConnectionStore;
    if (!activeConnection) return [];
    const dbs = activeConnection.databases.map((db, i) => {
      const tables = db.show
        ? db.tables.map((table, ii) => {
          const cols = table.show
            ? table.columns.map((col, iii) => {
              return { kind: 'column', obj: col } as MenuItemDb;
            })
            : [];
          return [
            { kind: 'table', obj: table } as MenuItemDb,
            ...cols
          ];
        })
        : [];
      return [
        { kind: 'db', obj: db } as MenuItemDb,
        ..._.flatten<MenuItemDb>(tables)
      ];
    });
    return _.flatten<MenuItemDb>(dbs);
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
              this.menuItems.map((item, i) => {
                switch (item.kind) {
                  case 'db':
                    return <List.Item
                      as="a"
                      key={`db-${i}`}
                      className="db-item"
                      onClick={e => item.obj.toggleShow()}
                    >
                      <List.Icon name="database" />
                      <List.Content>
                        {item.obj.name}
                      </List.Content>
                    </List.Item>;
                  case 'table':
                    return <List.Item
                      as="a"
                      key={`db-${i}`}
                      className="table-item"
                      onClick={e => item.obj.toggleShow()}
                    >
                      <List.Icon name="table" />
                      <List.Content>
                        {item.obj.name}
                      </List.Content>
                    </List.Item>;
                  case 'column':
                    return <List.Item
                      as="a"
                      key={`db-${i}`}
                      className="column-item"
                    >
                      <List.Icon name="columns" />
                      <List.Content>
                        {item.obj.name}
                      </List.Content>
                      {
                        item.obj.isPrimaryKey &&
                        <List.Icon name="key" color="yellow" />
                      }
                      {
                        item.obj.isForeignKey &&
                        <List.Icon name="key" color="grey" />
                      }
                    </List.Item>;
                }
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