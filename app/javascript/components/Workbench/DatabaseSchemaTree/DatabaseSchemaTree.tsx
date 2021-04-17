import React, { Fragment } from 'react';
import {
  Header,
  List,
  Popup,
  Menu,
  MenuItemProps,
  SemanticShorthandCollection,
  Button,
  Input
} from 'semantic-ui-react';
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
import DbSchema from '../../../models/DbSchema';
import SchemaItem from './SchemaItem';

export interface ContextMenuProps {
  dbRef: React.MutableRefObject<any>;
  items: SemanticShorthandCollection<MenuItemProps>;
}

export enum ItemKind {
  Database = 'database',
  Placeholder = 'placeholder',
  Schema = 'schema',
  Table = 'table',
  Column = 'column'
}
export const LINKABLE_ITEMS = [ItemKind.Column, ItemKind.Table, ItemKind.Schema];

interface DbTreeItem {
  treePosition: number;
  kind: ItemKind;
  indentLevel: 0 | 1 | 2 | 3;
  value: Database | DbColumn | DbTable | DbSchema | string;
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

export interface DbSchemaItem extends DbTreeItem {
  kind: ItemKind.Schema;
  value: DbSchema;
}

export interface DbDatabaseItem extends DbTreeItem {
  kind: ItemKind.Database;
  value: Database;
}

export interface DbPlaceholderItem extends DbTreeItem {
  kind: ItemKind.Placeholder;
  value: string;
}

export type TreeItem = DbDatabaseItem | DbSchemaItem | DbTableItem | DbColumnItem | DbPlaceholderItem;

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
    indentLevel: 0,
    draw: () => (
      <DatabaseItem
        key={treePosition}
        database={db}
        onOpenContextMenu={onOpenContextMenu}
        closeContextMenu={closeContextMenu}
      />
    )
  };
};

const getPlaceholderItem = (
  dbServerId: string,
  dbName: string,
  treePosition: number,
  isLoading?: boolean
): DbPlaceholderItem => {
  return {
    kind: ItemKind.Placeholder,
    value: dbName,
    treePosition: treePosition,
    indentLevel: 0,
    draw: () => (
      <PlaceholderItem key={treePosition} dbName={dbName} dbServerId={dbServerId} isLoading={isLoading} />
    )
  };
};

const getSchemaItem = (schema: DbSchema, treePosition: number): DbSchemaItem => {
  return {
    kind: ItemKind.Schema,
    value: schema,
    indentLevel: 1,
    treePosition: treePosition,
    draw: () => <SchemaItem key={treePosition} schema={schema} />
  };
};

const getTableItem = (table: DbTable, treePosition: number, showSchema: boolean): DbTableItem => {
  return {
    kind: ItemKind.Table,
    value: table,
    indentLevel: showSchema ? 2 : 1,
    treePosition: treePosition,
    draw: () => <TableItem key={treePosition} table={table} indentLevel={showSchema ? 2 : 1} />
  };
};

const getColumnItem = (column: DbColumn, treePosition: number, showSchema: boolean): DbColumnItem => {
  return {
    kind: ItemKind.Column,
    value: column,
    indentLevel: showSchema ? 3 : 2,
    treePosition: treePosition,
    draw: () => <ColumnItem key={treePosition} column={column} indentLevel={showSchema ? 3 : 2} />
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
      items: []
    }
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
    const activeDatabaseName = dbServerStore.activeDatabaseName(activeDbServerId);
    const filter = dbServerStore.databaseTreeViewFilter(activeDbServerId);

    let pos = 0;

    return databaseNames.reduce((dbs, dbName) => {
      if (filter.length > 0 && !dbName.startsWith(filter)) {
        return dbs;
      }
      if (!loadedDatabases.has(dbName)) {
        dbs.push(getPlaceholderItem(activeDbServerId, dbName, pos, dbName === activeDatabaseName));
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
      const showSchema = db.hasMultipleSchemas;
      const schemaItems = db.schemas.reduce((schemas, schema) => {
        if (showSchema) {
          schemas.push(getSchemaItem(schema, pos));
          pos += 1;
          if (!schema.show) {
            return schemas;
          }
        }
        const tableItems = schema.tables.reduce((tables, table) => {
          tables.push(getTableItem(table, pos, showSchema));
          pos += 1;
          if (!table.show) {
            return tables;
          }
          table.columns.forEach((col) => {
            tables.push(getColumnItem(col, pos, showSchema));
            pos += 1;
          });
          return tables;
        }, [] as TreeItem[]);
        schemas.push(...tableItems);
        return schemas;
      }, [] as TreeItem[]);
      dbs.push(...schemaItems);
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
        <Input
          size="mini"
          className="filter-databases"
          icon={{
            name: 'close',
            circular: true,
            link: true,
            onClick: () => activeDbServer.setTreeViewFilter('')
          }}
          placeholder="Filter"
          onChange={(_, data) => activeDbServer.setTreeViewFilter(data.value)}
          value={activeDbServer.treeViewFilter}
        />
        <div style={{ overflow: 'auto', display: 'flex' }}>
          <div style={{ width: '0', marginLeft: '3px' }}>
            <ForeignColumnLink menuItems={menuItems} />
          </div>
          <List
            className="database-index"
            style={{
              margin: '0 0 0 1em',
              padding: '0em',
              flex: '1'
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
