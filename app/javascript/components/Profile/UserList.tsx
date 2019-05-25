import React, { Fragment } from 'react';
import { Icon, Table, Button } from 'semantic-ui-react';
import { inject, observer } from 'mobx-react';
import UserStore from '../../stores/user_store';
import User, { Role } from '../../models/User';
import { deleteUser, updateUser } from '../../api/admin';
import SessionStore from '../../stores/session_store';

interface InjectedProps {
  userStore: UserStore;
  sessionStore: SessionStore;
}

@inject('userStore', 'sessionStore')
@observer
export default class UserList extends React.Component {
  componentDidMount() {
    this.injected.userStore.loadUsers();
  }

  get injected() {
    return this.props as InjectedProps;
  }

  onDeleteUser(id: string) {
    deleteUser(id).then(() => this.injected.userStore.loadUsers(true));
  }

  setUserRole(id: string, role: Role) {
    updateUser(id, { role: role }).then(() => this.injected.userStore.loadUsers(true));
  }

  render() {
    const { users } = this.injected.userStore;
    const { currentUser } = this.injected.sessionStore;
    return (
      <Fragment>
        <Button
          icon="refresh"
          label="Refresh users"
          labelPosition="left"
          onClick={() => this.injected.userStore.loadUsers(true)}
          floated="left"
          style={{ alignSelf: 'flex-start' }}
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
            {
              users.map((user) => {
                return (
                  <Table.Row key={user.email}>
                    <Table.Cell content={user.email} />
                    <Table.Cell content={User.formatDate(user.createdAt)} />
                    <Table.Cell content={User.formatDate(user.updatedAt)} />
                    <Table.Cell content={user.loginCount} />
                    <Table.Cell>
                      <Button.Group size="mini">
                        {
                          Object.values(Role).map((role) => {
                            return (
                              <Button
                                key={role}
                                content={role}
                                active={user.role === role}
                                onClick={() => this.setUserRole(user.id, role)}
                              />
                            );
                          })
                        }
                      </Button.Group>
                    </Table.Cell>
                    <Table.Cell>
                      <Icon
                        name={user.activated ? 'check circle' : 'times circle'}
                        color={user.activated ? 'green' : 'red' }
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
              })
            }
          </Table.Body>
        </Table>
      </Fragment>
    );
  }
}