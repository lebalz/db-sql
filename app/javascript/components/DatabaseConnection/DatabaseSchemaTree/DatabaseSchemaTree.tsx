import React, { Fragment } from 'react';
import { Header, List, Loader } from 'semantic-ui-react';
import SessionStore from '../../../stores/session_store';
import { RouterStore } from 'mobx-react-router';
import DbServerStore from '../../../stores/db_server_store';
import { inject, observer } from 'mobx-react';
import _ from 'lodash';
import DbTable from '../../../models/DbTable';
import { computed } from 'mobx';
import DbColumn from '../../../models/DbColumn';
import ForeignColumnLink from './ForeignColumnLink';
import Database from '../../../models/Database';
import DatabaseItem from './DatabaseItem';
import TableItem from './TableItem';
import ColumnItem from './ColumnItem';

interface InjectedProps {
  sessionStore: SessionStore;
  routerStore: RouterStore;
  dbServerStore: DbServerStore;
}

export enum ItemKind {
  Database = 'database',
  Table = 'table',
  Column = 'column'
}

interface DbTreeItem {
  treePosition: number;
  kind: ItemKind;
  value: Database | DbColumn | DbTable;
  draw: () => JSX.Element;
}

export interface DbColumnItem extends DbTreeItem {
  kind: ItemKind.Column;
  value: DbColumn;
}

export interface DbTableItem extends DbTreeItem {
  kind: ItemKind.Table;
  value: DbTable;
}

export interface DbDatabaseItem extends DbTreeItem {
  kind: ItemKind.Database;
  value: Database;
}

export type TreeItem = DbDatabaseItem | DbTableItem | DbColumnItem;

const getDatabaseItem = (db: Database, treePosition: number): DbDatabaseItem => {
  return {
    kind: ItemKind.Database,
    value: db,
    treePosition: treePosition,
    draw: () => <DatabaseItem key={treePosition} database={db} />
  };
};

const getTableItem = (table: DbTable, treePosition: number): DbTableItem => {
  return {
    kind: ItemKind.Table,
    value: table,
    treePosition: treePosition,
    draw: () => <TableItem key={treePosition} table={table} />
  };
};

const getColumnItem = (column: DbColumn, treePosition: number): DbColumnItem => {
  return {
    kind: ItemKind.Column,
    value: column,
    treePosition: treePosition,
    draw: () => <ColumnItem key={treePosition} column={column} />
  };
};

@inject('sessionStore', 'routerStore', 'dbServerStore')
@observer
export default class DatabaseSchemaTree extends React.Component {
  get injected() {
    return this.props as InjectedProps;
  }

  @computed get menuItems(): TreeItem[] {
    const { dbServerStore } = this.injected;
    const { activeConnection } = dbServerStore;
    if (!activeConnection) {
      return [];
    }

    let pos = 0;
    return activeConnection.databases.reduce((dbs, db) => {
      const dbItem = getDatabaseItem(db, pos);
      pos += 1;
      dbs.push(dbItem);
      if (!db.show) {
        return dbs;
      }
      const tableItems = db.tables.reduce((tables, table) => {
        tables.push(getTableItem(table, pos));
        pos += 1;
        if (!table.show) {
          return tables;
        }
        table.columns.forEach((col) => {
          tables.push(getColumnItem(col, pos));
          pos += 1;
        });
        return tables;
      }, [] as TreeItem[]);
      dbs.push(...tableItems);
      return dbs;
    }, [] as TreeItem[]);
  }

  render() {
    const { menuItems, injected } = this;
    const { dbServerStore } = injected;
    const { activeConnection } = dbServerStore;
    if (!activeConnection || activeConnection.isClosed) {
      return null;
    }

    const isLoaded = activeConnection.isLoaded;

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
            {menuItems.map((item) => item.draw())}
          </List>
        </div>
      </Fragment>
    );
  }
}
