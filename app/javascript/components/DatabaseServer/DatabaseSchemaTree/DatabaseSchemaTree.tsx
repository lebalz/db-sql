import React, { Fragment } from 'react';
import {
  Header,
  List,
  Loader,
  Popup,
  Menu,
  MenuItemProps,
  SemanticShorthandCollection,
  Ref,
  Button,
} from 'semantic-ui-react';
import SessionStore from '../../../stores/session_store';
import { RouterStore } from 'mobx-react-router';
import DbServerStore, { LoadState } from '../../../stores/db_server_store';
import { inject, observer } from 'mobx-react';
import _ from 'lodash';
import DbTable from '../../../models/DbTable';
import { computed, action } from 'mobx';
import DbColumn from '../../../models/DbColumn';
import ForeignColumnLink from './ForeignColumnLink';
import Database from '../../../models/Database';
import DatabaseItem from './DatabaseItem';
import TableItem from './TableItem';
import ColumnItem from './ColumnItem';
import PlaceholderItem from './PlaceholderItem';

export interface ContextMenuProps {
  dbRef: React.MutableRefObject<any>;
  items: SemanticShorthandCollection<MenuItemProps>;
}

export enum ItemKind {
  Database = 'database',
  Placeholder = 'placeholder',
  Table = 'table',
  Column = 'column',
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

const getDatabaseItem = (
  db: Database,
  treePosition: number,
  onOpenContextMenu: (props: ContextMenuProps) => void,
  closeContextMenu: () => void
): DbDatabaseItem => {
  return {
    kind: ItemKind.Database,
    value: db,
    treePosition: treePosition,
    draw: () => (
      <DatabaseItem
        key={treePosition}
        database={db}
        onOpenContextMenu={onOpenContextMenu}
        closeContextMenu={closeContextMenu}
      />
    ),
  };
};
const getPlaceholderItem = (dbServerId: string, dbName: string, treePosition: number): DbPlaceholderItem => {
  return {
    kind: ItemKind.Placeholder,
    value: dbName,
    treePosition: treePosition,
    draw: () => <PlaceholderItem key={treePosition} dbName={dbName} dbServerId={dbServerId} />,
  };
};

const getTableItem = (table: DbTable, treePosition: number): DbTableItem => {
  return {
    kind: ItemKind.Table,
    value: table,
    treePosition: treePosition,
    draw: () => <TableItem key={treePosition} table={table} />,
  };
};

const getColumnItem = (column: DbColumn, treePosition: number): DbColumnItem => {
  return {
    kind: ItemKind.Column,
    value: column,
    treePosition: treePosition,
    draw: () => <ColumnItem key={treePosition} column={column} />,
  };
};

interface InjectedProps {
  routerStore: RouterStore;
  dbServerStore: DbServerStore;
}

@inject('routerStore', 'dbServerStore')
@observer
export default class DatabaseSchemaTree extends React.Component {
  state: {
    contextMenuOpen: boolean;
    contextMenuProps: ContextMenuProps;
  } = {
    contextMenuOpen: false,
    contextMenuProps: {
      dbRef: React.createRef(),
      items: [],
    },
  };

  get injected() {
    return this.props as InjectedProps;
  }

  @action
  reloadDatabases() {
    this.injected.dbServerStore.activeDbServer?.reload();
    this.onCloseContextMenu();
  }

  onOpenContextMenu = (props: ContextMenuProps) => {
    this.setState({ contextMenuProps: props, contextMenuOpen: true });
  };

  onCloseContextMenu = (event?: React.MouseEvent<HTMLElement, MouseEvent>) => {
    event?.preventDefault();
    this.setState({ dbRef: React.createRef(), contextMenuOpen: false });
  };

  @computed get menuItems(): TreeItem[] {
    const { dbServerStore } = this.injected;
    const { activeDbServerId } = dbServerStore;
    if (!activeDbServerId) {
      return [];
    }
    const databaseNames = dbServerStore.databaseNames(activeDbServerId);
    const loadedDatabases = dbServerStore.loadedDatabaseMap(activeDbServerId);

    let pos = 0;

    return databaseNames.reduce((dbs, dbName) => {
      if (!loadedDatabases.has(dbName)) {
        dbs.push(getPlaceholderItem(activeDbServerId, dbName, pos));
        pos += 1;
        return dbs;
      }
      const db = loadedDatabases.get(dbName)!;
      const dbItem = getDatabaseItem(db, pos, this.onOpenContextMenu, this.onCloseContextMenu);
      pos += 1;
      dbs.push(dbItem);
      if (!db.show || db.isLoading) {
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

    return (
      <Fragment>
        <div className="database-index-header">
          <Header as="h3" content="Databases" />
          <Button
            size="mini"
            icon="refresh"
            onClick={() => this.reloadDatabases()}
            circular
            basic
            loading={dbServerStore.dbIndexLoadState === LoadState.Loading}
          />
        </div>
        <div style={{ overflow: 'auto', display: 'flex' }}>
          <div style={{ width: '0', marginLeft: '3px' }}>
            <ForeignColumnLink menuItems={menuItems} />
          </div>
          <List
            className="database-index"
            style={{
              margin: '0 0 0 1em',
              padding: '0em',
              flex: '1',
            }}
          >
            {menuItems.map((item) => item.draw())}
          </List>
          {/* context menu */}
        </div>
        <Popup
          context={this.state.contextMenuProps.dbRef}
          open={this.state.contextMenuOpen}
          onClose={this.onCloseContextMenu}
        >
          <Menu items={this.state.contextMenuProps.items} secondary vertical />
        </Popup>
      </Fragment>
    );
  }
}
