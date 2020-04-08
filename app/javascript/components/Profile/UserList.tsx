import React from 'react';
import { Icon, Table, Button } from 'semantic-ui-react';
import { inject, observer } from 'mobx-react';
import { computed } from 'mobx';
import UserStore, { ReloadState } from '../../stores/user_store';
import User, { Role } from '../../models/User';
import SessionStore from '../../stores/session_store';
import _ from 'lodash';

interface InjectedProps {
  userStore: UserStore;
  sessionStore: SessionStore;
}

@inject('userStore', 'sessionStore')
@observer
export default class UserList extends React.Component {
  get injected() {
    return this.props as InjectedProps;
  }

  onDeleteUser(id: string) {
    this.injected.userStore.deleteUser(id);
  }

  setUserRole(id: string, role: Role) {
    this.injected.userStore.updateUser(id, { role: role });
  }

  @computed get reloadIcon() {
    const { reloadState } = this.injected.userStore;
    switch (reloadState) {
      case ReloadState.Error:
        return 'times circle';
      case ReloadState.Success:
        return 'check circle';
      default:
        return 'refresh';
    }
  }

  @computed get reloadIconColor() {
    const { reloadState } = this.injected.userStore;
    switch (reloadState) {
      case ReloadState.Error:
        return 'red';
      case ReloadState.Success:
        return 'green';
      default:
        return 'grey';
    }
  }

  render() {
    const { users, reloadState } = this.injected.userStore;
    const { currentUser } = this.injected.sessionStore;
    return (
      <div>
        <Button
          icon={this.reloadIcon}
          color={this.reloadIconColor}
          label="Refresh Users"
          labelPosition="left"
          onClick={() => this.injected.userStore.loadUsers()}
          floated="left"
          style={{ alignSelf: 'flex-start' }}
          loading={reloadState === ReloadState.Loading}
        />
        <Table celled>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>E-Mail</Table.HeaderCell>
              <Table.HeaderCell>Created At</Table.HeaderCell>
              <Table.HeaderCell>Updated At</Table.HeaderCell>
              <Table.HeaderCell>Login Count</Table.HeaderCell>
              <Table.HeaderCell>Role</Table.HeaderCell>
              <Table.HeaderCell>Activated</Table.HeaderCell>
              <Table.HeaderCell>Delete</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {_.sortBy(users, ['email']).map((user) => {
              return (
                <Table.Row key={user.email}>
                  <Table.Cell content={user.email} />
                  <Table.Cell content={User.formatDate(user.createdAt)} />
                  <Table.Cell content={User.formatDate(user.updatedAt)} />
                  <Table.Cell content={user.loginCount} />
                  <Table.Cell>
                    <Button.Group size="mini">
                      {Object.values(Role).map((role) => {
                        return (
                          <Button
                            key={role}
                            content={role}
                            active={user.role === role}
                            onClick={() => this.setUserRole(user.id, role)}
                          />
                        );
                      })}
                    </Button.Group>
                  </Table.Cell>
                  <Table.Cell>
                    <Icon
                      name={user.activated ? 'check circle' : 'times circle'}
                      color={user.activated ? 'green' : 'red'}
                    />
                  </Table.Cell>
                  <Table.Cell>
                    <Button
                      disabled={currentUser.id === user.id}
                      icon="trash"
                      onClick={() => this.onDeleteUser(user.id)}
                      color="red"
                    />
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table>
      </div>
    );
  }
}
