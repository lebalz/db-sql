import React, { Fragment } from 'react';
import { Icon, List, Progress } from 'semantic-ui-react';
import DbServerStore from '../../../stores/db_server_store';
import { inject, observer } from 'mobx-react';
import { computed, reaction, IReactionDisposer } from 'mobx';
import _ from 'lodash';
import Database from '../../../models/Database';
import { REST } from '../../../declarations/REST';

interface DatabaseItemProps {
  database: Database;
}

interface InjectedDbItemPorps extends DatabaseItemProps {
  dbServerStore: DbServerStore;
}

@inject('dbServerStore')
@observer
export default class DatabaseItem extends React.Component<DatabaseItemProps> {
  itemRef = React.createRef<HTMLDivElement>();
  get injected() {
    return this.props as InjectedDbItemPorps;
  }
  scrollReaction?: IReactionDisposer;
  componentDidMount() {
    if (
      this.injected.dbServerStore.activeDbServer?.activeDatabase === this.props.database
    ) {
      this.scrollIntoView();
    }
    this.scrollReaction = reaction(
      () => this.injected.dbServerStore.activeDbServer?.activeDatabase,
      (database) => {
        if (database === this.props.database) {
          this.scrollIntoView();
        }
      }
    );
  }

  componentWillUnmount() {
    this.scrollReaction!();
  }

  scrollIntoView() {
    this.itemRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  @computed get color() {
    const { database } = this.props;
    const { activeDbServer } = this.injected.dbServerStore;

    if (activeDbServer?.activeDatabaseName === database.name) {
      return 'yellow';
    }
    if (
      this.injected.dbServerStore.isDatabaseLoaded(database.dbServerId, database.name)
    ) {
      return 'teal';
    }
    return 'grey';
  }

  render() {
    const { database } = this.injected;
    const { activeDbServer } = this.injected.dbServerStore;
    return (
      <Fragment>
        <List.Item
          as="a"
          data-dbname={database.name}
          className="database-item"
          onClick={(e) => {
            database.toggleShow();
            if (activeDbServer) {
              activeDbServer.setActiveDatabase(database.name);
              const { activeQuery } = database;
              if (activeQuery) {
                database.setActiveQuery(activeQuery.id);
              } else {
                database.setDefaultQueryActive();
              }
            }
          }}
        >
          <List.Content>
            <div style={{ display: 'flex' }} ref={this.itemRef}>
              {/* {database.requestState === REST.Requested ? (
                <Icon loading name="circle notch" />
              ) : ( */}
              <Icon fitted name="database" color={this.color} />
              {/* )} */}
              <span style={{ marginLeft: '10px' }}>{database.name}</span>
            </div>
          </List.Content>
        </List.Item>
        {/* {database.hasPendingRequest && (
          <List.Item>
            <List.Content>
              <Progress
                color="teal"
                size="tiny"
                active
                percent={
                  (100 * database.tables.filter((t) => t.isLoaded).length) /
                  database.tables.length
                }
              />
            </List.Content>
          </List.Item>
        )} */}
      </Fragment>
    );
  }
}
