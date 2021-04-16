import React, { Fragment } from 'react';
import { Icon, List, Ref, Segment, Button } from 'semantic-ui-react';
import DbServerStore from '../../../stores/db_server_store';
import { inject, observer } from 'mobx-react';
import { computed, reaction, IReactionDisposer, action } from 'mobx';
import _ from 'lodash';
import Database from '../../../models/Database';
import RouterStore from '../../../stores/router_store';
import { ContextMenuProps } from './DatabaseSchemaTree';
import { DbLoadIndicator } from './PlaceholderItem';

interface DatabaseItemProps {
  database: Database;
  onOpenContextMenu: (props: ContextMenuProps) => void;
  closeContextMenu: () => void;
}

interface InjectedDbItemPorps extends DatabaseItemProps {
  dbServerStore: DbServerStore;
  routerStore: RouterStore;
}

@inject('dbServerStore', 'routerStore')
@observer
export default class DatabaseItem extends React.Component<DatabaseItemProps> {
  itemRef = React.createRef<HTMLDivElement>();
  contextMenuRef = React.createRef<HTMLElement>();

  get injected() {
    return this.props as InjectedDbItemPorps;
  }
  scrollReaction?: IReactionDisposer;

  componentDidMount() {
    if (this.props.database.isActive) {
      this.scrollIntoView();
    }
    this.scrollReaction = reaction(
      () => this.props.database.isActive,
      (isActive) => {
        if (isActive) {
          this.scrollIntoView();
        }
      }
    );
  }

  get link() {
    const { database } = this.props;
    return `/connections/${database.dbServerId}/${database.name}`;
  }

  componentWillUnmount() {
    this.scrollReaction!();
  }

  scrollIntoView() {
    this.itemRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  }

  @action
  reloadDatabase() {
    this.props.database.reload();
    this.props.closeContextMenu();
  }

  @computed get color() {
    const { database } = this.props;

    if (database.isActive) {
      return 'yellow';
    }
    return 'teal';
  }

  render() {
    const { database } = this.injected;
    return (
      <Fragment>
        <Ref innerRef={this.contextMenuRef}>
          <List.Item
            as="a"
            data-dbname={database.name}
            className="database-item"
            onContextMenu={(e: any) => {
              e.preventDefault();
              this.props.onOpenContextMenu({
                dbRef: this.contextMenuRef,
                items: [
                  { key: 'reload', content: 'Reload', icon: 'refresh', onClick: () => this.reloadDatabase() }
                ]
              });
            }}
            onClick={() => {
              if (database.isActive) {
                database.toggleShow();
              } else {
                database.setShow(true);
              }
              this.injected.routerStore.push(this.link);
            }}
          >
            <List.Content>
              <div style={{ display: 'flex' }} ref={this.itemRef}>
                <Icon fitted name="database" color={this.color} />
                <span style={{ marginLeft: '10px' }}>{database.name}</span>
              </div>
            </List.Content>
          </List.Item>
        </Ref>
        {database.isLoading && <DbLoadIndicator />}
        {database.loadError && (
          <Segment inverted color="red">
            Error Loading the database schema:
            <pre>{database.loadError}</pre>
            {!database.dbServer.schemaQuery?.isDefault && (
              <Button
                size="mini"
                content="Try using the default"
                onClick={() => database.dbServer.useDefaultSchemaQuery()}
              />
            )}
          </Segment>
        )}
      </Fragment>
    );
  }
}
