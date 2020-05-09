import React from 'react';
import { Icon, Table, Button, Input, Popup } from 'semantic-ui-react';
import { inject, observer } from 'mobx-react';
import { computed, action } from 'mobx';
import UserStore, { ReloadState, SortableUserColumns, DEFAULT_SORT_ORDER } from '../../stores/user_store';
import User, { Role } from '../../models/User';
import SessionStore from '../../stores/session_store';
import _ from 'lodash';
import Highlighter from 'react-highlight-words';

interface InjectedProps {
  userStore: UserStore;
  sessionStore: SessionStore;
}

const COLUMN_NAMES: { [key in SortableUserColumns]: string } = {
  [SortableUserColumns.Email]: 'E-Mail',
  [SortableUserColumns.CreatedAt]: 'Created At',
  [SortableUserColumns.UpdatedAt]: 'Last Activity',
  [SortableUserColumns.Role]: 'Role',
  [SortableUserColumns.LoginCount]: 'Login Count',
  [SortableUserColumns.QueryCount]: 'Queries',
  [SortableUserColumns.ErrorQueryCount]: 'Errors',
  [SortableUserColumns.Activated]: 'Activated'
};

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

  @computed
  get order() {
    return this.injected.userStore.order === 'asc' ? 'ascending' : 'descending';
  }

  @action
  onChangeSort(columnName: SortableUserColumns) {
    if (this.injected.userStore.sortColumn === columnName) {
      this.injected.userStore.toggleOrder();
    } else {
      this.injected.userStore.setSortColumn(columnName);
      this.injected.userStore.setSortOrder(DEFAULT_SORT_ORDER[columnName]);
    }
  }

  render() {
    const { userStore } = this.injected;
    const { filteredUsers, reloadState, sortColumn } = userStore;
    const { currentUser } = this.injected.sessionStore;
    return (
      <div style={{ width: '100%' }}>
        <div id="userlist-commands">
          <Input
            className="filter-users"
            icon={{
              name: 'close',
              circular: true,
              link: true,
              onClick: () => userStore.setUserFilter('')
            }}
            placeholder="Filter"
            onChange={(_, data) => userStore.setUserFilter(data.value)}
            value={userStore.userFilter}
          />
          <Button
            icon={this.reloadIcon}
            color={this.reloadIconColor}
            label="Refresh Users"
            labelPosition="left"
            onClick={() => this.injected.userStore.loadUsers()}
            loading={reloadState === ReloadState.Loading}
          />
        </div>
        <Table celled sortable compact striped stackable>
          <Table.Header>
            <Table.Row>
              {Object.values(SortableUserColumns).map((column) => {
                return (
                  <Table.HeaderCell
                    key={column}
                    content={COLUMN_NAMES[column]}
                    sorted={column === sortColumn ? this.order : undefined}
                    onClick={() => this.onChangeSort(column)}
                  />
                );
              })}
              <Table.HeaderCell>Delete</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {filteredUsers.map((user) => {
              return (
                <Table.Row key={user.id}>
                  <Table.Cell
                    content={
                      <Highlighter textToHighlight={user.email} searchWords={[userStore.userFilter]} />
                    }
                  />
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
                  <Table.Cell content={user.queryCount} />
                  <Table.Cell content={user.errorQueryCount} />
                  <Table.Cell>
                    <Icon
                      name={user.activated ? 'check circle' : 'times circle'}
                      color={user.activated ? 'green' : 'red'}
                    />
                  </Table.Cell>
                  <Table.Cell>
                    <Popup
                      disabled={currentUser.id === user.id}
                      on="click"
                      position="top right"
                      trigger={<Button icon="trash" color="red" disabled={currentUser.id === user.id} />}
                      header="Confirm"
                      content={
                        <Button
                          icon="trash"
                          labelPosition="left"
                          content="Yes Delete"
                          color="red"
                          onClick={() => this.onDeleteUser(user.id)}
                        />
                      }
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
