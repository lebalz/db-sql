import React, { Fragment } from 'react';
import { Icon, List, Progress } from 'semantic-ui-react';
import DbConnectionStore from '../../stores/db_connection_store';
import { inject, observer } from 'mobx-react';
import { computed, reaction, IReactionDisposer } from 'mobx';
import _ from 'lodash';
import Database from '../../models/Database';
import { REST } from '../../declarations/REST';

interface DatabaseItemProps {
  database: Database;
}

interface InjectedDbItemPorps extends DatabaseItemProps {
  dbConnectionStore: DbConnectionStore;
}

@inject('dbConnectionStore')
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
        this.injected.dbConnectionStore.activeConnection &&
        this.injected.dbConnectionStore.activeConnection.activeDatabase,
      (database) => {
        if (database === this.injected.database) {
          this.itemRef.current!.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    );
  }

  componentWillUnmount() {
    this.scrollReaction!();
  }

  @computed get color() {
    const { database } = this.injected;
    const { activeConnection } = this.injected.dbConnectionStore;
    if (activeConnection && activeConnection.activeDatabase === database) {
      return 'yellow';
    }
    if (database.isLoaded) {
      return 'teal';
    }
    return 'grey';
  }

  render() {
    const { database } = this.injected;
    const { activeConnection } = this.injected.dbConnectionStore;
    return (
      <Fragment>
        <List.Item
          as="a"
          data-dbname={database.name}
          className="database-item"
          onClick={e => {
            database.toggleShow();
            if (activeConnection) {
              activeConnection.activeDatabase = database;
            }
          }}
        >
          <List.Content>
            <div style={{ display: 'flex' }} ref={this.itemRef}>
              {database.requestState === REST.Requested ? (
                <Icon loading name="circle notch" />
              ) : (
                <Icon fitted name="database" color={this.color} />
              )}
              <span style={{ marginLeft: '10px' }}>{database.name}</span>
            </div>
          </List.Content>
        </List.Item>
        {database.hasPendingRequest && (
          <List.Item>
            <List.Content>
              <Progress
                color="teal"
                size="tiny"
                active
                percent={
                  (100 * database.tables.filter(t => t.isLoaded).length) /
                  database.tables.length
                }
              />
            </List.Content>
          </List.Item>
        )}
      </Fragment>
    );
  }
}
