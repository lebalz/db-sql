import React from 'react';
import { Button, Menu, Icon } from 'semantic-ui-react';
import DbConnectionStore from '../../stores/db_connection_store';
import { inject, observer } from 'mobx-react';
import _ from 'lodash';
import { query as fetchQuery } from '../../api/db_connection';

interface InjectedProps {
  dbConnectionStore: DbConnectionStore;
}

@inject('dbConnectionStore')
@observer
export default class Database extends React.Component {

  get injected() {
    return this.props as InjectedProps;
  }

  render() {
    const { dbConnectionStore } = this.injected;
    const { loadedConnections, activeConnection } = dbConnectionStore;
    return (
      <Menu
        stackable
        secondary
        compact
        size="mini"
        color="teal"
      >
        {
          loadedConnections.map((conn, i) => {
            return (
              <Menu.Item
                key={i}
                onClick={() => dbConnectionStore.activeConnection = conn}
                active={activeConnection === conn}
              >
                <Icon name="plug" />
                {conn.name}
                {
                  activeConnection === conn &&
                  <Button
                    icon="close"
                    onClick={() => conn.close()}
                    floated="right"
                    style={{
                      padding: '2px',
                      marginLeft: '4px',
                      marginRight: '-4px'
                    }}
                  />
                }
              </Menu.Item>
            );
          })
        }
        <textarea id="query" style={{ width: '100%', height: '200px' }} />
        <Button
          onClick={
            () => {
              if (!activeConnection || !activeConnection.activeDatabase) {
                return;
              }
              const query = (document.getElementById('query') as any).value;
              fetchQuery(
                activeConnection.id,
                activeConnection.activeDatabase.name, query
              ).then(({ data }) => {
                console.log(data);
              });
            }
          }
        >
          Query
        </Button>
      </Menu>
    );
  }

}