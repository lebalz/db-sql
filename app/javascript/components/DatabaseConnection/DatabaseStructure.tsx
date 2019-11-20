import React, { Fragment } from 'react';
import { Header, Icon, List, Loader, Progress } from 'semantic-ui-react';
import SessionStore from '../../stores/session_store';
import { RouterStore } from 'mobx-react-router';
import DbConnectionStore from '../../stores/db_connection_store';
import { inject, observer } from 'mobx-react';
import _ from 'lodash';
import DbTable from '../../models/DbTable';
import { computed, action } from 'mobx';
import DbColumn, { Mark } from '../../models/DbColumn';
import ForeignColumnLink from './ForeignColumnLink';
import Database from '../../models/Database';
import DatabaseItem from './DatabaseItem';
import TableItem from './TableItem';
import ColumnItem from './ColumnItem';

interface InjectedProps {
  sessionStore: SessionStore;
  routerStore: RouterStore;
  dbConnectionStore: DbConnectionStore;
}

export type DbColumnItem = { kind: 'column'; obj: DbColumn; pos: number };
export type DbTableItem = { kind: 'table'; obj: DbTable; pos: number };
export type DbDatabaseItem = { kind: 'database'; obj: Database; pos: number };

export type MenuItemDb = DbDatabaseItem | DbTableItem | DbColumnItem;

@inject('sessionStore', 'routerStore', 'dbConnectionStore')
@observer
export default class DatabaseStructure extends React.Component {
  get injected() {
    return this.props as InjectedProps;
  }

  @computed get menuItems(): MenuItemDb[] {
    const { dbConnectionStore } = this.injected;
    const { activeConnection } = dbConnectionStore;
    if (!activeConnection) return [];
    let pos = 0;
    return activeConnection.databases.reduce((dbs, db) => {
      const dbItem = { kind: 'database', obj: db, pos: pos } as DbDatabaseItem;
      pos += 1;
      dbs.push(dbItem);
      if (!db.show) {
        return dbs;
      }
      const tableItems = db.tables.reduce((tables, table) => {
        const tableItem = {
          kind: 'table',
          obj: table,
          pos: pos,
          id: table.id
        } as DbTableItem;
        pos += 1;
        tables.push(tableItem);
        if (!table.show) {
          return tables;
        }
        const cols = table.columns.map((col) => {
          const colItem = {
            kind: 'column',
            obj: col,
            pos: pos
          } as DbColumnItem;
          pos += 1;
          return colItem;
        });
        tables.push(...cols);
        return tables;
      }, [] as MenuItemDb[]);
      dbs.push(...tableItems);
      return dbs;
    }, [] as MenuItemDb[]);
  }

  render() {
    const { menuItems, injected } = this;
    const { dbConnectionStore } = injected;
    const { activeConnection } = dbConnectionStore;
    const isLoaded = activeConnection && activeConnection.isLoaded;
    return (
      <Fragment>
        <Header as="h3" content="Databases" />
        {!isLoaded && (
          <Loader active inline="centered" indeterminate>
            Loading Databases
          </Loader>
        )}
        <div style={{ overflow: 'auto', display: 'flex' }}>
          <div style={{ width: '0', marginLeft: '3px' }}>
            <ForeignColumnLink menuItems={menuItems} />
          </div>
          <List
            style={{
              margin: '0 0 0 1em',
              padding: '0em',
              flex: '1'
            }}
          >
            {menuItems.map((item) => {
              switch (item.kind) {
                case 'database':
                  return <DatabaseItem key={item.pos} database={item.obj} />;
                case 'table':
                  return <TableItem key={item.pos} table={item.obj} />;
                case 'column':
                  return <ColumnItem key={item.pos} column={item.obj} />;
              }
            })}
          </List>
        </div>
      </Fragment>
    );
  }
}
