import React from 'react';
import { observer, inject } from 'mobx-react';
import { DbType } from '../../models/DbServer';
import {
  Label,
  Button,
  Modal,
  Form,
  Grid,
  DropdownProps,
  Message,
  Icon,
  Popup,
  Accordion,
  ButtonGroup
} from 'semantic-ui-react';
import DbServerStore from '../../stores/db_server_store';
import { computed, reaction, action, IReactionDisposer } from 'mobx';
import _ from 'lodash';
import SessionStore, { ApiRequestState } from '../../stores/session_store';
import { TempDbServerRole, TempDbServer as TempDbServerModel } from '../../models/TempDbServer';
import { REST } from '../../declarations/REST';
import SchemaQueryStore from '../../stores/schema_query_store';
import SchemaQuerySelection from './SchemaQuerySelection';
import GroupStore from '../../stores/group_store';
import { OwnerType } from '../../api/db_server';
import User from '../../models/User';
import Group from '../../models/Group';

interface InjectedProps {
  dbServerStore: DbServerStore;
  schemaQueryStore: SchemaQueryStore;
  groupStore: GroupStore;
  sessionStore: SessionStore;
}

@inject('dbServerStore', 'schemaQueryStore', 'groupStore', 'sessionStore')
@observer
export class TempDbServer extends React.Component {
  state = {
    showPassword: false,
    showDeleteConfirm: true,
    isOpen: false,
    showAdvanced: false
  };
  reactionDisposer: IReactionDisposer;

  constructor(props: any) {
    super(props);
    this.reactionDisposer = reaction(
      () => this.injected.dbServerStore.saveState,
      (state) => {
        if (state === ApiRequestState.Success) {
          this.onClose();
        }
      }
    );
  }

  componentWillUnmount() {
    this.reactionDisposer();
  }

  get injected() {
    return this.props as InjectedProps;
  }

  @computed
  get currentUser(): User {
    return this.injected.sessionStore.currentUser;
  }

  @computed
  get groupOwner(): Group | undefined {
    return this.injected.groupStore.joinedGroups.find((group) => group.id === this.dbServer.ownerId);
  }

  @computed
  get isModalOpen() {
    return !!this.injected.dbServerStore.tempDbServer;
  }

  @computed
  get dbServer() {
    return this.injected.dbServerStore.tempDbServer!;
  }

  @computed
  get dbNameOptions() {
    return _.uniq([undefined, ...this.dbServer.databases.map((db) => db.name), this.dbServer.initDb]).map(
      (name) => {
        return { key: `db-${name}`, text: name, value: name };
      }
    );
  }

  @computed
  get dbTableOptions() {
    return _.uniq([
      undefined,
      ...this.dbServer.tables.map((table) => table.name),
      this.dbServer.initTable
    ]).map((name) => {
      return { key: `table-${name}`, text: name, value: name };
    });
  }

  onClose() {
    this.setState({ showPassword: false, showAdvanced: false });
    this.injected.dbServerStore.setTempDbServer();
  }

  handleInitDbChange = (e: React.SyntheticEvent<HTMLElement, Event>, data: DropdownProps) => {
    const value = data.value as string | undefined;
    this.dbServer.initDb = value;
  };

  handleInitTableChange = (e: React.SyntheticEvent<HTMLElement, Event>, data: DropdownProps) => {
    const value = data.value as string | undefined;
    this.dbServer.initTable = value;
  };

  onSave() {
    switch (this.dbServer.role) {
      case TempDbServerRole.Create:
        this.injected.dbServerStore.createDbServer(this.dbServer);
        break;
      case TempDbServerRole.Update:
        this.injected.dbServerStore.updateDbServer(this.dbServer);
        break;
    }
  }

  @action
  duplicate(groupId: string, ownerType: OwnerType) {
    const dup = new TempDbServerModel(
      {
        ...this.dbServer.props,
        owner_id: groupId,
        owner_type: ownerType
      },
      this.injected.dbServerStore,
      this.injected.schemaQueryStore,
      TempDbServerRole.Create,
      this.dbServer.cancelToken
    );
    dup.name = `${dup.name}-copy`;
    dup.password = this.dbServer.password;
    this.injected.dbServerStore.setTempDbServer(dup);
  }

  delete() {
    this.injected.dbServerStore.remove(this.dbServer);
    this.onClose();
  }

  @computed
  get message() {
    let icon: 'circle notched' | 'check' | 'times' = 'check';
    const { validConnection, message } = this.dbServer;
    let header = 'Success';
    let content = message;
    if (validConnection === undefined) {
      header = 'Loading';
      icon = 'circle notched';
      content = 'Testing Connection';
    } else if (!validConnection) {
      header = 'Error';
      icon = 'times';
    }
    return (
      <Message
        icon
        info={validConnection === undefined}
        error={validConnection === false}
        success={validConnection}
        onDismiss={() => (this.dbServer.message = undefined)}
      >
        <Icon name={icon} loading={validConnection === undefined} />
        <Message.Content>
          <Message.Header content={header} />
          {content}
        </Message.Content>
      </Message>
    );
  }
  @action
  setDbType(dbType: DbType) {
    this.dbServer.dbType = dbType;
    this.injected.schemaQueryStore.setSelectedDbType(dbType);
  }

  render() {
    const name = this.dbServer ? this.dbServer.name : '';
    return (
      <Modal open={this.isModalOpen} onClose={() => this.onClose()} style={{ position: 'relative' }}>
        <Modal.Header content={`Database Connection: ${name}`} />
        {this.isModalOpen && this.dbServer.message && this.message}
        {this.isModalOpen && (
          <Modal.Content id="db-connection-modal">
            <Label
              icon={this.dbServer.ownerType === OwnerType.Group ? 'group' : 'user'}
              content={this.dbServer.ownerType === OwnerType.Group ? this.groupOwner?.name : 'Personal'}
              color={this.dbServer.ownerType === OwnerType.Group ? 'violet' : 'teal'}
              style={{ position: 'absolute', top: '8px', right: '8px' }}
            />
            <Grid stackable columns={2}>
              <Grid.Row>
                <Grid.Column>
                  <Label as="a" color="teal" ribbon content="Display Name" />
                  <Form.Input
                    fluid
                    placeholder="Display Name"
                    value={name}
                    onChange={(e) => (this.dbServer.name = e.target.value)}
                    type="text"
                  />
                </Grid.Column>
                <Grid.Column>
                  <Label
                    as="a"
                    color={this.dbServer.dbType === DbType.Psql ? 'blue' : 'orange'}
                    ribbon
                    content="Database Type"
                  />
                  <div>
                    <Button.Group color="teal">
                      <Button
                        content="PostgreSQL"
                        active={this.dbServer.dbType === DbType.Psql}
                        onClick={() => this.setDbType(DbType.Psql)}
                      />
                      <Button
                        content="MySql"
                        active={this.dbServer.dbType === DbType.MySql}
                        onClick={() => this.setDbType(DbType.MySql)}
                      />
                    </Button.Group>
                  </div>
                </Grid.Column>
              </Grid.Row>
              <Grid.Row>
                <Grid.Column>
                  <Form id="host-port-group">
                    <div className="host">
                      <Label as="a" color="teal" ribbon content="Host" />
                      <Form.Input
                        required
                        placeholder="IP Address or host name"
                        value={this.dbServer.host}
                        onChange={(e) => (this.dbServer.host = e.target.value)}
                        type="text"
                      />
                    </div>
                    <div>
                      <Label as="a" color="teal" ribbon content="Port" />
                      <Form.Input
                        required
                        style={{ width: '6rem' }}
                        value={this.dbServer.port}
                        onChange={(e) => (this.dbServer.port = parseInt(e.target.value, 10))}
                        type="number"
                      />
                    </div>
                  </Form>
                </Grid.Column>
                <Grid.Column>
                  <Label as="a" color="teal" ribbon content="Max. returned Rows" />
                  <Form.Input
                    required
                    value={this.dbServer.defaultSqlLimit}
                    onChange={(e) => (this.dbServer.defaultSqlLimit = parseInt(e.target.value, 10))}
                    type="number"
                  />
                </Grid.Column>
              </Grid.Row>
              <Grid.Row>
                <Grid.Column>
                  <Label as="a" color="teal" ribbon content="Username" />
                  <Form.Input
                    fluid
                    required
                    placeholder="Username"
                    value={this.dbServer.username}
                    onChange={(e) => (this.dbServer.username = e.target.value)}
                    type="text"
                  />
                </Grid.Column>
                <Grid.Column>
                  <Label as="a" color="teal" ribbon content="Password" />
                  <Form.Input
                    fluid
                    required
                    icon={{
                      name: 'eye',
                      circular: true,
                      link: true,
                      onClick: () =>
                        this.setState({
                          showPassword: !this.state.showPassword
                        })
                    }}
                    placeholder="Password"
                    value={this.dbServer.password || ''}
                    loading={this.dbServer.password === undefined}
                    onChange={(e) => (this.dbServer.password = e.target.value)}
                    type={this.state.showPassword ? 'text' : 'password'}
                  />
                </Grid.Column>
              </Grid.Row>
              <Grid.Row>
                <Grid.Column>
                  <Label as="a" color="teal" ribbon content="Initial DB (optional)" />
                  {this.dbServer.databases.length > 0 ? (
                    <Form.Dropdown
                      options={this.dbNameOptions}
                      placeholder="Initial DB"
                      search
                      selection
                      fluid
                      disabled={this.dbServer.dbRequestState !== REST.Success}
                      loading={this.dbServer.dbRequestState === REST.Requested}
                      value={this.dbServer.initDb ?? ''}
                      onChange={this.handleInitDbChange}
                    />
                  ) : (
                    <Form.Input
                      fluid
                      required
                      placeholder="Initial DB"
                      value={this.dbServer.initDb ?? ''}
                      onChange={(e) => (this.dbServer.initDb = e.target.value)}
                      type="text"
                    />
                  )}
                </Grid.Column>
                <Grid.Column>
                  <Label as="a" color="teal" ribbon content="Initial Table (optional)" />
                  <Form.Dropdown
                    options={this.dbTableOptions}
                    placeholder="Initial Table"
                    search
                    selection
                    fluid
                    disabled={this.dbServer.tableRequestState === REST.None}
                    loading={this.dbServer.tableRequestState === REST.Requested}
                    value={this.dbServer.initTable ?? ''}
                    onChange={this.handleInitTableChange}
                  />
                </Grid.Column>
              </Grid.Row>
              <Grid.Row columns={1}>
                <Grid.Column>
                  <Label as="a" color="teal" ribbon content="DB-Connection String" />
                  <Form.Input
                      fluid
                      placeholder={this.dbServer.dbType === DbType.Psql ? 'postgres://...' : 'mysql://...'}
                      value={this.dbServer.connectionString ?? ''}
                      onChange={(e) => (this.dbServer.setConnectionString(e.target.value))}
                      type="text"
                    />
                </Grid.Column>
              </Grid.Row>
            </Grid>
            <Accordion style={{ marginTop: '1em' }}>
              <Accordion.Title
                active={this.state.showAdvanced}
                onClick={() => this.setState({ showAdvanced: !this.state.showAdvanced })}
              >
                <Icon name="dropdown" />
                Advanced
              </Accordion.Title>
              <Accordion.Content active={this.state.showAdvanced}>
                <SchemaQuerySelection dbServer={this.dbServer} />
              </Accordion.Content>
            </Accordion>
          </Modal.Content>
        )}
        {this.dbServer && (
          <Modal.Actions>
            <Button
              icon="plug"
              labelPosition="left"
              content="Test"
              color="blue"
              loading={this.dbServer.testConnectionState === ApiRequestState.Waiting}
              onClick={() => {
                this.dbServer.testConnection.cancel();
                this.dbServer.testConnection();
              }}
              size="mini"
            />
            {this.injected.groupStore.adminGroups.length === 0 ? (
              <Button
                icon="copy"
                labelPosition="left"
                content="Duplicate"
                color="grey"
                onClick={() => this.duplicate(this.currentUser.id, OwnerType.User)}
                size="mini"
              />
            ) : (
              <Popup
                on="click"
                position="top center"
                trigger={
                  <Button icon="copy" labelPosition="left" content="Duplicate" color="grey" size="mini" />
                }
                content={
                  <Button.Group size="mini" style={{ maxWidth: '250px', overflowX: 'auto' }}>
                    <Button
                      onClick={() => this.duplicate(this.currentUser.id, OwnerType.User)}
                      content="Personal"
                      size="mini"
                      basic
                      color={this.dbServer.ownerType === OwnerType.User ? 'blue' : 'grey'}
                    />
                    {this.injected.groupStore.adminGroups.map((group) => {
                      return (
                        <Button
                          key={group.id}
                          onClick={() => this.duplicate(group.id, OwnerType.Group)}
                          content={group.name}
                          size="mini"
                          color={this.dbServer.ownerId === group.id ? 'blue' : 'grey'}
                          basic
                        />
                      );
                    })}
                  </Button.Group>
                }
              />
            )}
            <Popup
              on="click"
              position="top right"
              trigger={<Button icon="trash" labelPosition="left" content="Remove" color="red" size="mini" />}
              header="Confirm"
              size="mini"
              content={
                <Button
                  icon="trash"
                  labelPosition="left"
                  content="Yes Delete"
                  color="red"
                  onClick={() => this.delete()}
                  size="mini"
                />
              }
            />
            <Button
              icon="cancel"
              labelPosition="left"
              content="Cancel"
              color="black"
              onClick={() => this.onClose()}
              size="mini"
            />
            <Button
              icon="save"
              labelPosition="left"
              content="Save"
              color="green"
              onClick={() => this.onSave()}
              size="mini"
            />
          </Modal.Actions>
        )}
      </Modal>
    );
  }
}
