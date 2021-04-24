import React from 'react';
import { Button, Menu, Icon, Loader } from 'semantic-ui-react';
import DbServerStore from '../../stores/db_server_store';
import { inject, observer } from 'mobx-react';
import _ from 'lodash';
import { RouterStore } from 'mobx-react-router';
import DbServer from '../../models/DbServer';

interface Props {
  activeId: string;
  className?: string;
}

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

    dbServer.close();
  }

  render() {
    const { loadedDbServers } = this.injected.dbServerStore;
    const activeDbServer = this.injected.dbServerStore.find(this.props.activeId);
    const activeDbServerLoading = activeDbServer && !loadedDbServers.includes(activeDbServer);

    return (
      <Menu
        className={this.props.className}
        stackable
        secondary
        compact
        size="mini"
        color="teal"
        style={{ paddingLeft: '1em' }}
      >
        {loadedDbServers.map((dbServer, i) => {
          if (!dbServer) {
            return (
              <Menu.Item key={i}>
                <Loader indeterminate content="Loading..." />
              </Menu.Item>
            );
          }
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
                    marginRight: '-4px'
                  }}
                />
              )}
            </Menu.Item>
          );
        })}
        {activeDbServerLoading && activeDbServer && (
          <Menu.Item onClick={() => this.injected.routerStore.push(activeDbServer.link)} active>
            <Icon name="plug" />
            {activeDbServer.name}
            <Button
              icon="close"
              onClick={(e) => this.close(e, activeDbServer)}
              floated="right"
              style={{
                padding: '2px',
                marginLeft: '4px',
                marginRight: '-4px'
              }}
            />
          </Menu.Item>
        )}
      </Menu>
    );
  }
}
