import React, { Fragment } from 'react';
import { Icon, List, Progress } from 'semantic-ui-react';
import DbServerStore from '../../../stores/db_server_store';
import { inject, observer } from 'mobx-react';
import { computed, reaction, IReactionDisposer } from 'mobx';
import _ from 'lodash';
import Database from '../../../models/Database';
import { REST } from '../../../declarations/REST';
import { RouteComponentProps } from 'react-router';
import RouterStore from '../../../stores/router_store';

interface DatabaseItemProps {
  database: Database;
}

interface InjectedDbItemPorps extends DatabaseItemProps {
  dbServerStore: DbServerStore;
  routerStore: RouterStore;
}

@inject('dbServerStore', 'routerStore')
@observer
export default class DatabaseItem extends React.Component<DatabaseItemProps> {
  itemRef = React.createRef<HTMLDivElement>();
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
        <List.Item
          as="a"
          data-dbname={database.name}
          className="database-item"
          onClick={(e) => {
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
      </Fragment>
    );
  }
}
