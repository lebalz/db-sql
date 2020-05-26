import React from 'react';
import { observer, inject } from 'mobx-react';
import { DbType } from '../../models/DbServer';
import { Label, Button, Modal, Form, Grid, DropdownProps, Message, Icon, Popup } from 'semantic-ui-react';
import DbServerStore from '../../stores/db_server_store';
import { computed, reaction, action } from 'mobx';
import _ from 'lodash';
import { ApiRequestState } from '../../stores/session_store';
import { TempDbServerRole, TempDbServer as TempDbServerModel } from '../../models/TempDbServer';
import { REST } from '../../declarations/REST';

interface InjectedProps {
  dbServerStore: DbServerStore;
}

@inject('dbServerStore')
@observer
export class TempDbServer extends React.Component {
  state = {
    showPassword: false,
    showDeleteConfirm: true,
    isOpen: false
  };

  constructor(props: any) {
    super(props);
    reaction(
      () => this.injected.dbServerStore.saveState,
      (state) => {
        if (state === ApiRequestState.Success) {
          this.onClose();
        }
      }
    );
  }

  get injected() {
    return this.props as InjectedProps;
  }

  @computed get isModalOpen() {
    return !!this.injected.dbServerStore.tempDbServer;
  }

  @computed
  get dbServer() {
    return this.injected.dbServerStore.tempDbServer!;
  }

  @computed get dbNameOptions() {
    return _.uniq([undefined, ...this.dbServer.databases.map((db) => db.name), this.dbServer.initDb]).map(
      (name) => {
        return { key: `db-${name}`, text: name, value: name };
      }
    );
  }

  @computed get dbTableOptions() {
    return _.uniq([
      undefined,
      ...this.dbServer.tables.map((table) => table.name),
      this.dbServer.initTable
    ]).map((name) => {
      return { key: `table-${name}`, text: name, value: name };
    });
  }

  onClose() {
    this.setState({ showPassword: false });
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

  @action duplicate() {
    const dup = new TempDbServerModel(
      this.dbServer.props,
      this.injected.dbServerStore,
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

  @computed get message() {
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

  render() {
    const name = this.dbServer ? this.dbServer.name : '';
    return (
      <Modal open={this.isModalOpen} onClose={() => this.onClose()}>
        <Modal.Header content={`Database Connection: ${name}`} />
        {this.isModalOpen && this.dbServer.message && this.message}
        {this.isModalOpen && (
          <Modal.Content id="db-connection-modal">
            <Grid stackable columns={2}>
              <Grid.Row>
                <Grid.Column>
                  <Label as="a" color="teal" ribbon content="Display Name" />
                  <Form.Input
                    fluid
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
                        onClick={() => (this.dbServer.dbType = DbType.Psql)}
                      />
                      <Button
                        content="MySql"
                        active={this.dbServer.dbType === DbType.MySql}
                        onClick={() => (this.dbServer.dbType = DbType.MySql)}
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
            </Grid>
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
                this.dbServer.testConnection()
              }}
            />
            <Button
              icon="copy"
              labelPosition="left"
              content="Duplicate"
              color="grey"
              onClick={() => this.duplicate()}
            />
            <Popup
              on="click"
              position="top right"
              trigger={<Button icon="trash" labelPosition="left" content="Remove" color="red" />}
              header="Confirm"
              content={
                <Button
                  icon="trash"
                  labelPosition="left"
                  content="Yes Delete"
                  color="red"
                  onClick={() => this.delete()}
                />
              }
            />
            <Button
              icon="cancel"
              labelPosition="left"
              content="Cancel"
              color="black"
              onClick={() => this.onClose()}
            />
            <Button
              icon="save"
              labelPosition="left"
              content="Save"
              color="green"
              onClick={() => this.onSave()}
            />
          </Modal.Actions>
        )}
      </Modal>
    );
  }
}
