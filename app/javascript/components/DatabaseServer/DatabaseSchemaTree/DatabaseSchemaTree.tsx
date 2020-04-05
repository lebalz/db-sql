import React, { Fragment } from 'react';
import { Header, List, Loader, PlaceholderImage } from 'semantic-ui-react';
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
import DatabaseStore from '../../../stores/database_store';
import PlaceholderItem from './PlaceholderItem';

interface InjectedProps {
  sessionStore: SessionStore;
  routerStore: RouterStore;
  dbServerStore: DbServerStore;
  databaseStore: DatabaseStore;
}

export enum ItemKind {
  Database = 'database',
  Placeholder = 'placeholder',
  Table = 'table',
  Column = 'column'
}

interface DbTreeItem {
  treePosition: number;
  kind: ItemKind;
  value: Database | DbColumn | DbTable | string;
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

export interface DbPlaceholderItem extends DbTreeItem {
  kind: ItemKind.Placeholder;
  value: string;
}

export type TreeItem = DbDatabaseItem | DbTableItem | DbColumnItem | DbPlaceholderItem;

const getDatabaseItem = (db: Database, treePosition: number): DbDatabaseItem => {
  return {
    kind: ItemKind.Database,
    value: db,
    treePosition: treePosition,
    draw: () => <DatabaseItem key={treePosition} database={db} />
  };
};

const getPlaceholderItem = (dbName: string, treePosition: number): DbPlaceholderItem => {
  return {
    kind: ItemKind.Placeholder,
    value: dbName,
    treePosition: treePosition,
    draw: () => <PlaceholderItem key={treePosition} dbName={dbName} />
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

@inject('sessionStore', 'routerStore', 'dbServerStore', 'databaseStore')
@observer
export default class DatabaseSchemaTree extends React.Component {
  get injected() {
    return this.props as InjectedProps;
  }

  @computed get menuItems(): TreeItem[] {
    const { databaseStore, dbServerStore } = this.injected;
    const { activeDbServerId } = dbServerStore;
    if (!activeDbServerId) {
      return [];
    }
    const databaseNames = databaseStore.databaseNames(activeDbServerId);
    const loadedDatabases = databaseStore.loadedDatabaseMap(activeDbServerId);

    let pos = 0;

    return databaseNames.reduce((dbs, dbName) => {
      if (!loadedDatabases.has(dbName)) {
        dbs.push(getPlaceholderItem(dbName, pos));
        pos += 1;
        return dbs;
      }
      const db = loadedDatabases.get(dbName)!;
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
    const { activeDbServer } = dbServerStore;
    if (!activeDbServer) {
      return null;
    }

    const isLoaded = true;

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
