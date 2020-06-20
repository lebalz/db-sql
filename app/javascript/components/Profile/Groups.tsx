import React, { Fragment } from 'react';
import {
  Segment,
  Checkbox,
  Button,
  Header,
  List,
  Label,
  Icon,
  Dropdown,
  DropdownItemProps,
  DropdownProps
} from 'semantic-ui-react';
import { inject, observer } from 'mobx-react';
import UserStore from '../../stores/user_store';
import GroupStore from '../../stores/group_store';
import GroupCard from './Groups/GroupCard';
import AddEntityButton from '../../shared/AddEntityButton';
import { computed, action } from 'mobx';
import Group from '../../models/Group';
import { groupBy } from 'lodash';
import ClickableIcon from '../../shared/ClickableIcon';
import { addGroupMember } from '../../api/group';
import GroupMember from '../../models/GroupMember';

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

  @computed
  get isGroupAdmin(): boolean {
    if (!this.activeGroup) {
      return false;
    }
    return this.activeGroup.admins.map((user) => user.id).includes(this.injected.userStore.loggedInUser.id);
  }

  @computed
  get memberOptions(): DropdownItemProps[] {
    return this.injected.groupStore.filteredGroupUsers.map((user) => {
      return {
        key: user.id,
        value: user.id,
        text: user.email
      };
    });
  }

  addMember = action((event: React.SyntheticEvent<HTMLElement, Event>, data: DropdownProps) => {
    const { activeGroup } = this;
    if (!activeGroup) {
      return;
    }
    addGroupMember(activeGroup.id, data.value as string).then(({ data }) => {
      activeGroup.members.push(new GroupMember(this.injected.groupStore, this.injected.userStore, data));
    });
  });

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
                {this.isGroupAdmin && (
                  <Dropdown
                    placeholder="Add User"
                    fluid
                    search
                    selection
                    value=""
                    options={this.memberOptions}
                    onChange={this.addMember}
                  />
                )}
                <div className="member-list">
                  {this.activeGroup.members.map((member) => {
                    return (
                      <div className="member" key={member.user?.id}>
                        <div>{member.user?.email}</div>
                        <div className="spacer" />
                        {member.isAdmin ? (
                          <Label
                            content="admin"
                            size="mini"
                            color="teal"
                            onClick={() => member.setAdminPermission(false)}
                            as="a"
                          />
                        ) : (
                          <Label
                            content="user"
                            size="mini"
                            basic
                            onClick={() => member.setAdminPermission(true)}
                            as="a"
                          />
                        )}
                        {this.isGroupAdmin && (
                          <ClickableIcon
                            icon="minus circle"
                            color="red"
                            onClick={() => member.remove()}
                            disabled={member.user?.id === this.injected.userStore.loggedInUser.id}
                          />
                        )}
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
