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
import { action, computed } from 'mobx';
import DbColumn, { Mark } from '../models/DbColumn';
import ForeignColumnLink from './ForeignColumnLink';

interface InjectedProps {
  sessionStore: SessionStore;
  routerStore: RouterStore;
  dbConnectionStore: DbConnectionStore;
}

export type DbColumnItem = { kind: 'column', obj: DbColumn, pos: number }
export type DbTableItem = { kind: 'table', obj: DbTable, pos: number }

export type MenuItemDb = { kind: 'db', obj: Database, pos: number }
  | DbTableItem
  | DbColumnItem;

@inject('sessionStore', 'routerStore', 'dbConnectionStore')
@observer
export default class Connections extends React.Component {

  get injected() {
    return this.props as InjectedProps;
  }

  @action onMouseOver(item: DbColumnItem) {
    if (item.obj.foreignColumn) {
      item.obj.mark = Mark.From;
      item.obj.foreignColumn.mark = Mark.To;
    } else if (item.obj.isPrimaryKey) {
      item.obj.mark = Mark.To;
      item.obj.referencedBy.forEach(ref => ref.mark = Mark.From);
    }
  }
  @action onMouseOut(item: DbColumnItem) {
    if (item.obj.foreignColumn) {
      item.obj.mark = Mark.None;
      item.obj.foreignColumn.mark = Mark.None;
    } else if (item.obj.isPrimaryKey) {
      item.obj.mark = Mark.None;
      item.obj.referencedBy.forEach(ref => ref.mark = Mark.None);
    }
  }

  @computed get menuItems(): MenuItemDb[] {
    const { dbConnectionStore } = this.injected;
    const { activeConnection } = dbConnectionStore;
    if (!activeConnection) return [];
    let pos = 0;
    const dbs = activeConnection.databases.map((db, i) => {
      const dbItem = { kind: 'db', obj: db, pos: pos } as MenuItemDb;
      pos += 1;
      const tables = db.show
        ? db.tables.map((table, ii) => {
          const tableItem = { kind: 'table', obj: table, pos: pos } as MenuItemDb;
          pos += 1;
          const cols = table.show
            ? table.columns.map((col, iii) => {
              const colItem = { kind: 'column', obj: col, pos: pos } as MenuItemDb;
              pos += 1;
              return colItem;
            })
            : [];
          return [
            tableItem,
            ...cols
          ];
        })
        : [];
      return [
        dbItem,
        ..._.flatten<MenuItemDb>(tables)
      ];
    });
    return _.flatten<MenuItemDb>(dbs);
  }

  render() {
    const { menuItems, injected } = this;
    const { dbConnectionStore } = injected;
    const { loadedConnections, activeConnection } = dbConnectionStore;
    return (
      <Fragment>
        <header>
          <NavBar />
        </header>
        <div id="sidebar">
          <Header as="h3" content="Databases" />
          <div style={{ overflow: 'auto' }}>
            <div style={{ width: '0', position: 'absolute', marginLeft: '3px' }}>
              <ForeignColumnLink menuItems={menuItems} />
            </div>
            <List
              style={{
                margin: '0 0 0 1em',
                padding: '0em',
                overflowY: 'auto',
                flex: '1'
              }}
            >
              {
                menuItems.map((item, i) => {
                  const highlighted = item.kind === 'db' ? false : item.obj.mark !== Mark.None;

                  switch (item.kind) {
                    case 'table':
                    case 'db':
                      return <List.Item
                        as="a"
                        key={`db-${i}`}
                        className={`${item.kind}-item`}
                        onClick={e => item.obj.toggleShow()}
                      >
                        <List.Icon name="database" color={highlighted ? 'yellow' : 'grey'} />
                        <List.Content>
                          {item.obj.name}
                        </List.Content>
                      </List.Item>;
                    case 'column':
                      return <List.Item
                        as="a"
                        key={`db-${i}`}
                        className="column-item"
                        onMouseOver={() => this.onMouseOver(item)}
                        onMouseOut={() => this.onMouseOut(item)}
                      >
                        <List.Icon name="columns" color={highlighted ? 'yellow' : 'grey'} />
                        <List.Content
                          className={item.obj.isPrimaryKey ? 'primary-key' : ''}
                        >
                          {item.obj.name}
                        </List.Content>
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