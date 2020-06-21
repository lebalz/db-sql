import React, { Fragment, SyntheticEvent } from 'react';
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
  DropdownProps,
  Input,
  InputOnChangeData
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
import cx from 'classnames';
import Tooltip from '../../shared/Tooltip';
import Actions from './SchemaQueries/Actions';
import { REST } from '../../declarations/REST';
import _ from 'lodash';

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

  @computed
  get groups(): Group[] {
    const escapedFilter = _.escapeRegExp(this.injected.groupStore.groupFilter);
    const regexp = new RegExp(escapedFilter, 'i');

    return this.injected.groupStore.myGroups.filter((group) => regexp.test(group.name));
  }

  onChangeName = (event: SyntheticEvent<HTMLInputElement>, data: InputOnChangeData) => {
    event.preventDefault();
    if (this.activeGroup) {
      this.activeGroup.name = data.value;
    }
  };
  onChangeGroupFilter = (event: SyntheticEvent<HTMLInputElement>, data: InputOnChangeData) => {
    event.preventDefault();
    this.injected.groupStore.setGroupFilter(data.value);
  };

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
        <div className="card-grid group-config">
          <div className="cards">
            <div className="cards-container">
              {this.groups.map((group) => {
                return (
                  <GroupCard
                    key={group.id}
                    group={group}
                    isActive={this.injected.groupStore.activeGroupId === group.id}
                  />
                );
              })}
            </div>
          </div>
          <div className="selection">
            <Input
              size="mini"
              value={this.injected.groupStore.groupFilter}
              onChange={this.onChangeGroupFilter}
              placeholder="Filter Groups..."
            />
            <Tooltip delayed content="Refresh schema query list">
              <Button icon="refresh" size="mini" onClick={() => this.injected.groupStore.refresh()} />
            </Tooltip>
            <Tooltip delayed content="Add a new schema query">
              <Button icon="add" size="mini" onClick={() => this.injected.groupStore.addNewGroup()} />
            </Tooltip>
          </div>
          {this.activeGroup && (
            <Fragment>
              <div
                className={cx('name', {
                  ['dirty-right']: this.activeGroup.name !== this.activeGroup.pristineState.name
                })}
              >
                <Input
                  value={this.activeGroup.name ?? ''}
                  onChange={this.onChangeName}
                  disabled={!this.activeGroup.isAdmin}
                  placeholder="Group Name..."
                />
              </div>
              <div className="editable">
                <Button
                  onClick={() => this.activeGroup?.togglePublicPrivate()}
                  icon={this.activeGroup.isPrivate ? 'lock' : 'lock open'}
                  color={this.activeGroup.isPrivate ? 'black' : 'yellow'}
                  size="mini"
                  label={this.activeGroup.isPrivate ? 'Private Group' : 'Public Group'}
                  labelPosition="left"
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
              </div>
              <Actions
                for={this.activeGroup}
                isSaving={this.injected.groupStore.requestState === REST.Requested}
                size="mini"
              />
            </Fragment>
          )}
        </div>
      </Segment>
    );
  }
}
