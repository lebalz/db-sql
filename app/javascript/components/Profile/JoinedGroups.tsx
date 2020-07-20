import React, { Fragment, SyntheticEvent } from 'react';
import { Segment, Button, Input, InputOnChangeData } from 'semantic-ui-react';
import { inject, observer } from 'mobx-react';
import UserStore from '../../stores/user_store';
import GroupStore, { MemberType } from '../../stores/group_store';
import GroupCard from './Groups/GroupCard';
import { computed } from 'mobx';
import Group from '../../models/Group';
import Tooltip from '../../shared/Tooltip';
import Actions from './SchemaQueries/Actions';
import { REST } from '../../declarations/REST';
import _ from 'lodash';
import GroupProps from './Groups/GroupProps';
import Editable from './Groups/Editable';
import QueryLog from '../QueryLog';

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
  get groups(): Group[] {
    const escapedFilter = _.escapeRegExp(this.injected.groupStore.groupFilter);
    const regexp = new RegExp(escapedFilter, 'i');

    return this.injected.groupStore.joinedGroups.filter((group) => regexp.test(group.name));
  }

  onChangeGroupFilter = (event: SyntheticEvent<HTMLInputElement>, data: InputOnChangeData) => {
    event.preventDefault();
    this.injected.groupStore.setGroupFilter(data.value);
  };

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
                    isActive={this.injected.groupStore.activeGroup === group}
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
              style={{ flexGrow: 1, marginRight: '0.5em' }}
            />
            <Tooltip delayed content="Refresh groups">
              <Button
                icon="refresh"
                size="mini"
                onClick={() => this.injected.groupStore.refresh(MemberType.Joined)}
              />
            </Tooltip>
            <Tooltip delayed content="Add a new schema query">
              <Button icon="add" size="mini" onClick={() => this.injected.groupStore.addNewGroup()} />
            </Tooltip>
          </div>
          {this.activeGroup && (
            <Fragment>
              <GroupProps group={this.activeGroup} />
              <div style={{ display: 'flex' }}>
                <div style={{ flexGrow: 1 }}>
                  <Editable
                    group={this.activeGroup}
                    currentUserId={this.injected.userStore.loggedInUser.id}
                  />
                  {this.isGroupAdmin && (
                    <Actions
                      for={this.activeGroup}
                      isSaving={this.injected.groupStore.requestState === REST.Requested}
                      size="mini"
                    />
                  )}
                </div>
                <div style={{ flexGrow: 2, marginLeft: '1em' }}>
                  <QueryLog basic={true} groupId={this.activeGroup.id} />
                </div>
              </div>
            </Fragment>
          )}
        </div>
      </Segment>
    );
  }
}
