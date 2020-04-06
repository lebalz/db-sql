import React from 'react';
import { Button, Menu, Icon } from 'semantic-ui-react';
import DbServerStore from '../../stores/db_server_store';
import { inject, observer } from 'mobx-react';
import _ from 'lodash';
import { RouterStore } from 'mobx-react-router';
import DbServer from '../../models/DbServer';

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

  close(e: React.MouseEvent<HTMLButtonElement, MouseEvent>, dbServer: DbServer) {
    e.stopPropagation();

    const { loadedDbServers } = this.injected.dbServerStore;
    const idx = loadedDbServers.indexOf(dbServer);
    dbServer.close();

    const numQueries = loadedDbServers.length;
    if (numQueries > 1) {
      const nextDbServer = loadedDbServers[idx > 0 ? idx - 1 : 1];
      this.injected.routerStore.push(nextDbServer.link);
    }

  }

  render() {
    const { loadedDbServers, activeDbServer } = this.injected.dbServerStore;

    return (
      <Menu stackable secondary compact size="mini" color="teal">
        {loadedDbServers.map((dbServer, i) => {
          return (
            <Menu.Item
              key={i}
              onClick={() => this.injected.routerStore.push(dbServer.link)}
              active={activeDbServer === dbServer}
            >
              <Icon name="plug" />
              {dbServer.name}
              {activeDbServer === dbServer && (
                <Button
                  icon="close"
                  onClick={(e) => this.close(e, dbServer)}
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
