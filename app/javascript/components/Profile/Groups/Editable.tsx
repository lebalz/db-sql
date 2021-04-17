import React from 'react';
import { Label, Button, Dropdown, DropdownProps, DropdownItemProps, Popup, Icon } from 'semantic-ui-react';
import { observer, inject } from 'mobx-react';
import { computed, action } from 'mobx';
import Group from '../../../models/Group';
import ClickableIcon from '../../../shared/ClickableIcon';
import { addGroupMember } from '../../../api/group';
import GroupStore from '../../../stores/group_store';
import Tooltip from '../../../shared/Tooltip';
import GroupMember from '../../../models/GroupMember';

interface Props {
  group: Group;
  currentUserId: string;
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
              disabled={this.group.isOutdated}
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
          <div className="spacer" />
          {this.group.isOutdated && (
            <Popup
              on="click"
              position="top right"
              trigger={
                <Button
                  icon="warning sign"
                  color="red"
                  size="mini"
                  content="Reset Crypto Key"
                  title="This action resets the crypto key of a group and all db server passwords will be lost. This can be nexessary when you had to reset your login password and no other group member is available to log in. This step can be avoided, whan another group member logs in to db-sql."
                  labelPosition="right"
                />
              }
              header="Confirm"
              size="mini"
              content={
                <Button
                  icon="warning sign"
                  labelPosition="left"
                  content="Yes reset the groups key. All db server passwords will be lost."
                  color="red"
                  onClick={() => this.group.resetCryptoKey()}
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
            disabled={this.group.isOutdated}
          />
        )}
        <div className="member-list">
          {this.group.members.map((member) => {
            return (
              <div className="member" key={`${member.userId}${member.groupId}`}>
                <div>{member.user?.email}</div>
                <div className="spacer" />
                {member.isOutdated && (
                  <Tooltip
                    content={
                      member.userId === this.props.currentUserId
                        ? 'Your password was reset and your group key is outdated. Wait until another member loggs in or reset the groups crypto key manually.'
                        : 'The password was reset what outdated the group key of this user. Reload the page to fix.'
                    }
                    position="top right"
                    delayed
                  >
                    <Icon name="warning sign" color="yellow" />
                  </Tooltip>
                )}
                <AdminBadge isOutdated={this.group.isOutdated} isAdmin={member.isAdmin} member={member} />
                {this.group.isAdmin && (
                  <ClickableIcon
                    icon="minus circle"
                    color="red"
                    onClick={() => this.injected.groupStore.removeMemberFromGroup(this.group, member.userId)}
                    disabled={member.isCurrentUser || this.group.isOutdated}
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

const AdminBadge = (props: { isOutdated: boolean; isAdmin: boolean; member: GroupMember }) => {
  const { isAdmin, isOutdated, member } = props;
  return (
    <Label
      content={isAdmin ? 'admin' : 'user'}
      color={isAdmin ? 'teal' : undefined}
      size="mini"
      basic={!isAdmin}
      onClick={() => {
        if (!isOutdated) {
          member.setAdminPermission(!isAdmin);
        }
      }}
      as={member.isCurrentUser ? undefined : 'a'}
    />
  );
};
