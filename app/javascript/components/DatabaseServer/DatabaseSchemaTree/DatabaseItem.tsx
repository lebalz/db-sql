import React, { Fragment } from 'react';
import { Icon, List, Progress } from 'semantic-ui-react';
import DbServerStore from '../../../stores/db_server_store';
import { inject, observer } from 'mobx-react';
import { computed, reaction, IReactionDisposer } from 'mobx';
import _ from 'lodash';
import Database from '../../../models/Database';
import { REST } from '../../../declarations/REST';
import DatabaseStore from '../../../stores/database_store';

interface DatabaseItemProps {
  database: Database;
}

interface InjectedDbItemPorps extends DatabaseItemProps {
  dbServerStore: DbServerStore;
  databaseStore: DatabaseStore;
}

@inject('dbServerStore', 'databaseStore')
@observer
export default class DatabaseItem extends React.Component<DatabaseItemProps> {
  itemRef = React.createRef<HTMLDivElement>();
  get injected() {
    return this.props as InjectedDbItemPorps;
  }
  scrollReaction?: IReactionDisposer;
  componentDidMount() {
    this.scrollReaction = reaction(
      () =>
        this.injected.dbServerStore.activeDbServer &&
        this.injected.dbServerStore.activeDbServer.activeDatabase,
      (database) => {
        if (database === this.injected.database) {
          this.itemRef.current!.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }
      }
    );
  }

  componentWillUnmount() {
    this.scrollReaction!();
  }

  @computed get color() {
    const { database } = this.props;
    const { activeDatabaseName } = this.injected.databaseStore;

    if (activeDatabaseName === database.name) {
      return 'yellow';
    }
    if (
      this.injected.databaseStore.isLoadedDatabase(database.dbServerId, database.name)
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
              activeDbServer.activeDatabase = database;
              const { activeQuery } = database;
              if (activeQuery) {
                activeQuery.setActive();
              } else {
                // const { lastQuery } = database;
                // if (lastQuery) {
                //   lastQuery.setActive();
                // } else {
                //   database.addQuery().setActive();
                // }
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
