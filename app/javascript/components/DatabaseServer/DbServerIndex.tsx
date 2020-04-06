import React, { Fragment } from 'react';
import { Button, Menu, Icon, Segment } from 'semantic-ui-react';
import DbServerStore from '../../stores/db_server_store';
import { inject, observer } from 'mobx-react';
import _ from 'lodash';
import SqlEditor from './SqlEditor';
import SqlResults from './SqlResults';
import { action } from 'mobx';
import { default as DatabaseModel } from '../../models/Database';
import Query from '../../models/Query';
import { REST } from '../../declarations/REST';
import { RouterStore } from 'mobx-react-router';

interface Props {}

interface InjectedProps extends Props {
  dbServerStore: DbServerStore;
  routerStore: RouterStore;
}

@inject('dbServerStore', 'routerStore')
@observer
export default class DbServerIndex extends React.Component<Props> {
  get injected() {
    return this.props as InjectedProps;
  }

  render() {
    const { loadedDbServers, activeDbServer } = this.injected.dbServerStore;

    return (
      <Menu stackable secondary compact size="mini" color="teal">
        {loadedDbServers.map((dbServer, i) => {
          return (
            <Menu.Item
              key={i}
              onClick={() => this.injected.routerStore.push(`./${dbServer.id}`)}
              active={activeDbServer === dbServer}
            >
              <Icon name="plug" />
              {dbServer.name}
              {activeDbServer === dbServer && (
                <Button
                  icon="close"
                  onClick={() => console.log('close me, haha')}
                  floated="right"
                  style={{
                    padding: '2px',
                    marginLeft: '4px',
                    marginRight: '-4px',
                  }}
                />
              )}
            </Menu.Item>
          );
        })}
      </Menu>
    );
  }
}
