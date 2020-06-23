import React, { Fragment, SyntheticEvent } from 'react';
import { Segment, Button, Input, InputOnChangeData } from 'semantic-ui-react';
import { inject, observer } from 'mobx-react';
import UserStore from '../../stores/user_store';
import GroupStore, { MemberType } from '../../stores/group_store';
import GroupCard from './Groups/GroupCard';
import { computed } from 'mobx';
import Group from '../../models/Group';
import Tooltip from '../../shared/Tooltip';
import _ from 'lodash';
import GroupProps from './Groups/GroupProps';

interface InjectedProps {
  groupStore: GroupStore;
  userStore: UserStore;
}

@inject('userStore', 'groupStore')
@observer
export default class PublicGroups extends React.Component {
  get injected() {
    return this.props as InjectedProps;
  }

  @computed
  get activeGroup(): Group | undefined {
    return this.injected.groupStore.activePublicGroup;
  }

  @computed
  get groups(): Group[] {
    const escapedFilter = _.escapeRegExp(this.injected.groupStore.publicGroupFilter);
    const regexp = new RegExp(escapedFilter, 'i');

    return this.injected.groupStore.publicGroups.filter((group) => regexp.test(group.name));
  }

  onChangeGroupFilter = (event: SyntheticEvent<HTMLInputElement>, data: InputOnChangeData) => {
    event.preventDefault();
    this.injected.groupStore.setPublicGroupFilter(data.value);
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
                    isActive={this.injected.groupStore.activePublicGroup === group}
                  />
                );
              })}
            </div>
          </div>
          {this.activeGroup && (
            <Fragment>
              <div className="selection">
                <Input
                  size="mini"
                  value={this.injected.groupStore.publicGroupFilter}
                  onChange={this.onChangeGroupFilter}
                  placeholder="Filter Groups..."
                />
                <Tooltip delayed content="Refresh public groups">
                  <Button icon="refresh" size="mini" onClick={() => this.injected.groupStore.refresh(MemberType.Public)} />
                </Tooltip>
              </div>
              <GroupProps group={this.activeGroup} isReadonly />
              <div className="editable">
                <Button
                  onClick={() => this.activeGroup?.join()}
                  color="blue"
                  size="mini"
                  content="Join"
                />
              </div>
            </Fragment>
          )}
        </div>
      </Segment>
    );
  }
}
