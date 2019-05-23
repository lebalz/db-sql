import React, { Fragment } from 'react';
import { Segment, Menu, Icon, List, Header, Table, Button } from 'semantic-ui-react';
import { inject, observer } from 'mobx-react';
import UserStore from '../../stores/user_store';
import User from '../../models/User';
import { deleteUser } from '../../api/admin';

interface InjectedProps {
  userStore: UserStore;
}

@inject('userStore')
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

  render() {
    const { users } = this.injected.userStore;
    return (
      <Fragment>
        <Button
          icon="refresh"
          onClick={() => this.injected.userStore.loadUsers(true)}
          floated="left"
          style={{alignSelf: 'flex-start'}}
        />
        <Table celled>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>E-Mail</Table.HeaderCell>
              <Table.HeaderCell>Created At</Table.HeaderCell>
              <Table.HeaderCell>Updated At</Table.HeaderCell>
              <Table.HeaderCell>Login Count</Table.HeaderCell>
              <Table.HeaderCell>Last Login</Table.HeaderCell>
              <Table.HeaderCell>Role</Table.HeaderCell>
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
                    <Table.Cell content={User.formatDate(user.lastLogin)} />
                    <Table.Cell content={user.role} />
                    <Table.Cell>
                      <Button
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