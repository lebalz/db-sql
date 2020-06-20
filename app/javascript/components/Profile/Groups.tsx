import React, { Fragment } from 'react';
import { Segment, Checkbox, Button, Header, List, Label, Icon } from 'semantic-ui-react';
import { inject, observer } from 'mobx-react';
import UserStore from '../../stores/user_store';
import GroupStore from '../../stores/group_store';
import GroupCard from './Groups/GroupCard';
import AddEntityButton from '../../shared/AddEntityButton';
import { computed } from 'mobx';
import Group from '../../models/Group';
import { groupBy } from 'lodash';

interface InjectedProps {
  groupStore: GroupStore;
  userStore: UserStore;
}

@inject('userStore', 'groupStore')
@observer
export default class Groups extends React.Component {
  get injected() {
    return this.props as InjectedProps;
  }

  componentDidMount() {
    if (!this.activeGroup && this.injected.groupStore.myGroups.length > 0) {
      this.injected.groupStore.setActiveGroupId(this.injected.groupStore.myGroups[0].id);
    }
  }

  @computed
  get activeGroup(): Group | undefined {
    return this.injected.groupStore.activeGroup;
  }

  render() {
    return (
      <Segment style={{ width: '100%', height: '100%' }}>
        <div id="groups-grid">
          <div className="groups">
            <div className="cards-container">
              {this.injected.groupStore.myGroups.map((group) => {
                return (
                  <GroupCard
                    key={group.id}
                    group={group}
                    isActive={this.injected.groupStore.activeGroupId === group.id}
                  />
                );
              })}
              <AddEntityButton
                onClick={() => {
                  this.injected.groupStore.addNewGroup();
                }}
                title="Add new group"
              />
            </div>
          </div>
          <div className="configuration">
            {this.activeGroup && (
              <Fragment>
                <Header as="h2" content={this.activeGroup.name} />
                <Button
                  onClick={() => this.activeGroup?.togglePublicPrivate()}
                  icon={this.activeGroup.isPrivate ? 'lock' : 'lock open'}
                  color={this.activeGroup.isPrivate ? 'black' : 'yellow'}
                  size="mini"
                />
                <div className="member-list">
                  {this.activeGroup.members.map((member) => {
                    return (
                      <div className="member" key={member.user.id}>
                        <div>{member.user.email}</div>
                        <div className="spacer" />
                        {member.isAdmin ? (
                          <Label content="admin" size="mini" color="teal" onClick={() => member.setAdminPermission(false)} as="a" />
                        ) : (
                          <Label content="user" size="mini" basic onClick={() => member.setAdminPermission(true)} as="a" />
                        )}
                        <Icon name="minus circle" color="red" />
                      </div>
                    );
                  })}
                </div>
              </Fragment>
            )}
          </div>
        </div>
      </Segment>
    );
  }
}
