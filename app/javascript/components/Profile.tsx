import React, { Fragment } from 'react';
import { Divider, Menu, Checkbox, CheckboxProps } from 'semantic-ui-react';
import NavBar from './Navigation/NavBar';
import { inject, observer } from 'mobx-react';
import SessionStore from '../stores/session_store';
import { RouteComponentProps } from 'react-router';
import Account from './Profile/Account';
import ChangePassword from './Profile/ChangePassword';
import { RouterStore } from 'mobx-react-router';
import UserStore from '../stores/user_store';
import UserList from './Profile/UserList';
import DeleteAccount from './Profile/DeleteAccount';
import SchemaQueries from './Profile/SchemaQueries';
import Groups from './Profile/JoinedGroups';
import PublicGroups from './Profile/PublicGroups';
import GroupStore, { MemberType } from '../stores/group_store';
import QueryLog from './QueryLog';

interface MatchParams {
  part: string;
  id?: string;
}

interface ProfileProps extends RouteComponentProps<MatchParams> {}

interface InjectedProps extends ProfileProps {
  sessionStore: SessionStore;
  routerStore: RouterStore;
  userStore: UserStore;
  groupStore: GroupStore;
}

@inject('sessionStore', 'routerStore', 'userStore', 'groupStore')
@observer
export default class Profile extends React.Component<ProfileProps> {
  get injected() {
    return this.props as InjectedProps;
  }

  render() {
    const router = this.injected.routerStore;
    const part = this.props.match.params.part;
    return (
      <Fragment>
        <header>
          <NavBar />
        </header>
        <Menu id="sidebar" style={{ margin: 0 }}>
          <Menu.Item
            name="account"
            icon="address card"
            active={part === 'account'}
            onClick={() => router.push('/profile/account')}
          />
          <Menu.Item
            name="new password"
            icon="key"
            active={part === 'change_password'}
            onClick={() => router.push('/profile/change_password')}
          />
          <Menu.Item
            name="delete account"
            icon="trash"
            active={part === 'delete_account'}
            onClick={() => router.push('/profile/delete_account')}
          />
          <Menu.Item
            name="Query Log"
            icon="file alternate"
            active={part === 'query_log'}
            onClick={() => router.push('/profile/query_log')}
          />
          <Divider horizontal content="Groups" />
          <Menu.Item
            name="My Groups"
            icon="group"
            active={part === 'my_groups'}
            onClick={() => router.push('/profile/my_groups')}
          />
          {this.injected.groupStore.publicGroups.length > 0 && (
            <Menu.Item
              name="Public Groups"
              icon="group"
              active={part === 'public_groups'}
              onClick={() => router.push('/profile/public_groups')}
            />
          )}
          {this.injected.userStore.showAdvancedSettings && (
            <Fragment>
              <Divider horizontal content="Advanced" />
              <Menu.Item
                name="schema queries"
                icon="edit"
                active={part === 'schema_queries'}
                onClick={() => router.push('/profile/schema_queries')}
              />
            </Fragment>
          )}
          {this.injected.sessionStore.currentUser.isAdmin && (
            <Fragment>
              <Divider horizontal content="Admin" />
              <Menu.Item
                name="users"
                icon="users"
                active={part === 'users'}
                onClick={() => router.push('/profile/users')}
              />
            </Fragment>
          )}
          <div className="spacer" />
          <Menu.Item
            content={
              <Checkbox
                style={{}}
                label="Show Advanced"
                checked={this.injected.userStore.showAdvancedSettings}
                onChange={(_e: React.FormEvent<HTMLInputElement>, data: CheckboxProps) => {
                  this.injected.userStore.setShowAdvancedSettings(!!data.checked);
                }}
              />
            }
          />
        </Menu>
        <main style={{ alignItems: 'center' }}>
          {(() => {
            switch (part) {
              case 'account':
                return <Account />;
              case 'change_password':
                return <ChangePassword />;
              case 'delete_account':
                return <DeleteAccount />;
              case 'query_log':
                return <QueryLog filter />;
              case 'users':
                return <UserList />;
              case 'schema_queries':
                return <SchemaQueries />;
              case 'my_groups':
                if (this.props.match.params.id) {
                  this.injected.groupStore.setActiveGroupId(MemberType.Joined, this.props.match.params.id);
                }
                return <Groups />;
              case 'public_groups':
                return <PublicGroups />;
              default:
                return '404';
            }
          })()}
        </main>
      </Fragment>
    );
  }
}
