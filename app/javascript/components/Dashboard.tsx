import React, { Fragment } from 'react';
import { Divider, Icon, Accordion, Label } from 'semantic-ui-react';
import NavBar from './Navigation/NavBar';
import SessionStore from '../stores/session_store';
import { RouterStore } from 'mobx-react-router';
import DbServerStore from '../stores/db_server_store';
import { inject, observer } from 'mobx-react';
import DbServerOverview from './Dashboard/DbServerOverview';
import { TempDbServer as TempDbServerComponent } from './Dashboard/TempDbServer';
import _ from 'lodash';
import { OwnerType } from '../api/db_server';
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
            {this.injected.groupStore.joinedGroups.map((group) => {
              const isActive = !this.injected.groupStore.reducedDashboardGroups.includes(group.id);
              return (
                <Fragment key={group.id}>
                  <Accordion.Title
                    style={{ display: 'flex' }}
                    content={
                      <Fragment>
                        {group.name}
                        <div className="spacer" />
                        <Label content={group.dbServerCount} />
                      </Fragment>
                    }
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
        </main>
      </Fragment>
    );
  }
}
