import React, { Fragment } from 'react';
import { Header, Button, Divider, Icon, Accordion } from 'semantic-ui-react';
import NavBar from './Navigation/NavBar';
import SessionStore from '../stores/session_store';
import { RouterStore } from 'mobx-react-router';
import DbServerStore from '../stores/db_server_store';
import { inject, observer } from 'mobx-react';
import DbServerOverview from './Dashboard/DbServerOverview';
import { TempDbServer as TempDbServerComponent } from './Dashboard/TempDbServer';
import _ from 'lodash';
import { TempDbServer, TempDbServerRole } from '../models/TempDbServer';
import { DbServer, OwnerType } from '../api/db_server';
import { DbType } from '../models/DbServer';
import SchemaQueryStore from '../stores/schema_query_store';
import AddDbServer from './Dashboard/AddDbServer';
import GroupStore from '../stores/group_store';

interface InjectedProps {
  sessionStore: SessionStore;
  routerStore: RouterStore;
  dbServerStore: DbServerStore;
  schemaQueryStore: SchemaQueryStore;
  groupStore: GroupStore;
}

const DEFAULT_DB_SERVER: DbServer = {
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  owner_type: OwnerType.User,
  owner_id: '',
  db_type: DbType.Psql,
  host: '',
  id: '',
  name: '',
  port: 5432,
  username: '',
  query_count: 0,
  database_schema_query_id: '',
  error_query_count: 0
};

@inject('sessionStore', 'routerStore', 'dbServerStore', 'schemaQueryStore', 'groupStore')
@observer
export default class Dashboard extends React.Component {
  get injected() {
    return this.props as InjectedProps;
  }

  render() {
    const { userDbServers } = this.injected.dbServerStore;
    return (
      <Fragment>
        <header>
          <NavBar />
        </header>
        <main className="no-sidebar">
          <TempDbServerComponent />
          <Divider
            horizontal
            content={
              <span>
                <Icon name="user" /> your db servers
              </span>
            }
          />
          <div className="db-server-overview">
            {_.sortBy(userDbServers, ['name']).map((dbConnection) => {
              return <DbServerOverview key={dbConnection.id} dbConnection={dbConnection} />;
            })}
            <AddDbServer ownerType={OwnerType.User} ownerId={this.injected.sessionStore.currentUser.id} />
          </div>
          <Divider
            horizontal
            content={
              <span>
                <Icon name="group" /> MY GROUPS
              </span>
            }
          />
          <Accordion fluid styled exclusive={false}>
            {this.injected.groupStore.myGroups.map((group) => {
              const isActive = !this.injected.groupStore.reducedGroups.includes(group.id);
              return (
                <Fragment key={group.id}>
                  <Accordion.Title
                    content={<span>{group.name}</span>}
                    active={isActive}
                    onClick={() => this.injected.groupStore.toggleExpanded(group.id)}
                  />
                  <Accordion.Content active={isActive}>
                    <div className="db-server-overview">
                      {group.dbServers.map((dbConnection) => {
                        return <DbServerOverview key={dbConnection.id} dbConnection={dbConnection} />;
                      })}
                      {group.isAdmin && <AddDbServer ownerType={OwnerType.Group} ownerId={group.id} />}
                    </div>
                  </Accordion.Content>
                </Fragment>
              );
            })}
          </Accordion>
          {this.injected.groupStore.publicGroups.length > 0 && (
            <Fragment>
              <Divider
                horizontal
                content={
                  <span>
                    <Icon name="group" /> PUBLIC GROUPS
                  </span>
                }
              />
              <Accordion fluid styled exclusive={false}>
                {this.injected.groupStore.publicGroups.map((group) => {
                  const isActive = !this.injected.groupStore.reducedGroups.includes(group.id);
                  return (
                    <Fragment key={group.id}>
                      <Accordion.Title
                        content={<span>{group.name}</span>}
                        active={isActive}
                        onClick={() => this.injected.groupStore.toggleExpanded(group.id)}
                      />
                      <Accordion.Content active={isActive}>
                        <div className="db-server-overview">
                          {_.sortBy(group.dbServers, ['name']).map((dbConnection) => {
                            return <DbServerOverview key={dbConnection.id} dbConnection={dbConnection} />;
                          })}
                          {group.isAdmin && <AddDbServer ownerType={OwnerType.Group} ownerId={group.id} />}
                        </div>
                      </Accordion.Content>
                    </Fragment>
                  );
                })}
              </Accordion>
            </Fragment>
          )}
        </main>
      </Fragment>
    );
  }
}
