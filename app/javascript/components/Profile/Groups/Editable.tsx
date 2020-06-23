import React from 'react';
import { Label, Button, Dropdown, DropdownProps, DropdownItemProps, Popup } from 'semantic-ui-react';
import { observer, inject } from 'mobx-react';
import { computed, action } from 'mobx';
import Group from '../../../models/Group';
import ClickableIcon from '../../../shared/ClickableIcon';
import { addGroupMember } from '../../../api/group';
import GroupStore from '../../../stores/group_store';

interface Props {
  group: Group;
}

interface InjectedProps extends Props {
  groupStore: GroupStore;
}

@inject('groupStore')
@observer
export default class Editable extends React.Component<Props> {
  get injected() {
    return this.props as InjectedProps;
  }

  @computed
  get group() {
    return this.props.group;
  }

  addMember = action((event: React.SyntheticEvent<HTMLElement, Event>, data: DropdownProps) => {
    addGroupMember(this.group.id, data.value as string).then(({ data }) => {
      this.group.addMemberClientSide(data);
    });
  });

  @computed
  get memberOptions(): DropdownItemProps[] {
    return this.injected.groupStore.filteredUserProfiles.map((user) => {
      return {
        key: user.id,
        value: user.id,
        text: user.email
      };
    });
  }

  render() {
    return (
      <div className="editable">
        <div style={{ display: 'flex', marginBottom: '0.5em' }}>
          {this.group.isAdmin && (
            <Button
              onClick={() => this.group.togglePublicPrivate()}
              icon={this.group.isPrivate ? 'lock' : 'lock open'}
              color={this.group.isPrivate ? 'black' : 'yellow'}
              size="mini"
              content={this.group.isPrivate ? 'Private Group' : 'Public Group'}
              disabled={!this.group.isAdmin}
              labelPosition="right"
            />
          )}
          {this.group.canLeave && (
            <Popup
              on="click"
              position="top right"
              trigger={
                <Button
                  icon="sign-out alternate"
                  color="red"
                  size="mini"
                  content="Leave"
                  labelPosition="right"
                />
              }
              header="Confirm"
              size="mini"
              content={
                <Button
                  icon="sign-out alternate"
                  labelPosition="left"
                  content="Yes Leave"
                  color="red"
                  onClick={() => this.group.leave()}
                  size="mini"
                />
              }
            />
          )}
        </div>
        {this.group.isAdmin && (
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
          {this.group.members.map((member) => {
            return (
              <div className="member" key={`${member.userId}${member.groupId}`}>
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
                {this.group.isAdmin && (
                  <ClickableIcon
                    icon="minus circle"
                    color="red"
                    onClick={() => this.injected.groupStore.removeMemberFromGroup(this.group, member.userId)}
                    disabled={member.isCurrentUser}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}
