import React from 'react';
import { observer, inject } from 'mobx-react';
import { DbType } from '../../models/DbConnection';
import {
  Label,
  Button,
  Modal,
  Form,
  Grid,
  DropdownProps,
  Message,
  Icon,
  Popup
} from 'semantic-ui-react';
import DbConnectionStore from '../../stores/db_connection_store';
import { computed, reaction, action } from 'mobx';
import _ from 'lodash';
import { RequestState } from '../../stores/session_store';
import {
  TempDbConnectionRole,
  TempDbConnection as TempDbConnectionModel
} from '../../models/TempDbConnection';

interface InjectedProps {
  dbConnectionStore: DbConnectionStore;
}

@inject('dbConnectionStore')
@observer
export class TempDbConnection extends React.Component {
  constructor(props: any) {
    super(props);

    reaction(
      () => this.injected.dbConnectionStore.saveState,
      (state) => {
        if (state === RequestState.Success) {
          this.onClose();
        }
      }
    );
  }

  get injected() {
    return this.props as InjectedProps;
  }

  state = {
    showPassword: false,
    showDeleteConfirm: true
  };

  @computed get dbConnection() {
    return this.injected.dbConnectionStore.tempDbConnection!;
  }

  @computed get isModalOpen() {
    return !!this.injected.dbConnectionStore.tempDbConnection;
  }

  @computed get dbNameOptions() {
    return _.uniq([
      undefined,
      ...this.dbConnection.databases.map((db) => db.name),
      this.dbConnection.initialDb
    ]).map((name) => {
      return { key: `db-${name}`, text: name, value: name };
    });
  }

  @computed get dbTableOptions() {
    return _.uniq([
      undefined,
      ...this.dbConnection.tables.map((table) => table.name),
      this.dbConnection.initialTable
    ]).map((name) => {
      return { key: `table-${name}`, text: name, value: name };
    });
  }

  onClose() {
    this.setState({ showPassword: false });
    this.injected.dbConnectionStore.setTempDbConnection();
  }

  handleInitDbChange = (
    e: React.SyntheticEvent<HTMLElement, Event>,
    data: DropdownProps
  ) => {
    const value = data.value as string | undefined;
    this.dbConnection.initialDb = value;
  };

  handleInitTableChange = (
    e: React.SyntheticEvent<HTMLElement, Event>,
    data: DropdownProps
  ) => {
    const value = data.value as string | undefined;
    this.dbConnection.initialTable = value;
  };

  onSave() {
    switch (this.dbConnection.role) {
      case TempDbConnectionRole.Create:
        this.injected.dbConnectionStore.createDbConnection(this.dbConnection);
        break;
      case TempDbConnectionRole.Update:
        this.injected.dbConnectionStore.updateDbConnection(this.dbConnection);
        break;
    }
  }

  @action duplicate() {
    const dup = new TempDbConnectionModel(
      this.dbConnection.props,
      TempDbConnectionRole.Create,
      this.dbConnection.cancelToken
    );
    dup.name = `${dup.name}-copy`;
    dup.password = this.dbConnection.password;
    this.injected.dbConnectionStore.setTempDbConnection(dup);
  }

  delete() {
    this.injected.dbConnectionStore.remove(this.dbConnection);
    this.onClose();
  }

  @computed get message() {
    let icon: 'circle notched' | 'check' | 'times' = 'check';
    const { validConnection, message } = this.dbConnection;
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
        onDismiss={() => (this.dbConnection.message = undefined)}
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
    const name = this.dbConnection ? this.dbConnection.name : '';
    return (
      <Modal open={this.isModalOpen} onClose={() => this.onClose()}>
        <Modal.Header content={`Database Connection: ${name}`} />
        {this.isModalOpen && this.dbConnection.message && this.message}
        {this.isModalOpen && (
          <Modal.Content id="db-connection-modal">
            <Grid stackable columns={2}>
              <Grid.Row>
                <Grid.Column>
                  <Label as="a" color="teal" ribbon content="Display Name" />
                  <Form.Input
                    fluid
                    value={name}
                    onChange={(e) => (this.dbConnection.name = e.target.value)}
                    type="text"
                  />
                </Grid.Column>
                <Grid.Column>
                  <Label
                    as="a"
                    color={this.dbConnection.dbType === DbType.Psql ? 'blue' : 'orange'}
                    ribbon
                    content="Database Type"
                  />
                  <div>
                    <Button.Group color="teal">
                      <Button
                        content="PostgreSQL"
                        active={this.dbConnection.dbType === DbType.Psql}
                        onClick={() => (this.dbConnection.dbType = DbType.Psql)}
                      />
                      <Button
                        content="MySql"
                        active={this.dbConnection.dbType === DbType.MySql}
                        onClick={() => (this.dbConnection.dbType = DbType.MySql)}
                      />
                    </Button.Group>
                  </div>
                </Grid.Column>
              </Grid.Row>
              <Grid.Row>
                <Grid.Column>
                  <Label as="a" color="teal" ribbon content="Host: Port" />
                  <Form id="host-port-group">
                    <Form.Group>
                      <Form.Input
                        required
                        value={this.dbConnection.host}
                        onChange={(e) => (this.dbConnection.host = e.target.value)}
                        type="text"
                      />
                      <Form.Input
                        required
                        style={{ width: '6rem' }}
                        value={this.dbConnection.port}
                        onChange={(e) =>
                          (this.dbConnection.port = parseInt(e.target.value, 10))
                        }
                        type="number"
                      />
                    </Form.Group>
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
                    value={this.dbConnection.username}
                    onChange={(e) => (this.dbConnection.username = e.target.value)}
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
                    value={this.dbConnection.password || ''}
                    loading={this.dbConnection.password === undefined}
                    onChange={(e) => (this.dbConnection.password = e.target.value)}
                    type={this.state.showPassword ? 'text' : 'password'}
                  />
                </Grid.Column>
              </Grid.Row>
              <Grid.Row>
                <Grid.Column>
                  <Label as="a" color="teal" ribbon content="Initial DB (optional)" />
                  <Form.Dropdown
                    options={this.dbNameOptions}
                    placeholder="Initial DB"
                    search
                    selection
                    fluid
                    disabled={!this.dbConnection.isLoaded}
                    loading={this.dbConnection.isLoaded === undefined}
                    value={this.dbConnection.initialDb || ''}
                    onChange={this.handleInitDbChange}
                  />
                </Grid.Column>
                <Grid.Column>
                  <Label as="a" color="teal" ribbon content="Initial Table (optional)" />
                  <Form.Dropdown
                    options={this.dbTableOptions}
                    placeholder="Initial Table"
                    search
                    selection
                    fluid
                    disabled={!this.dbConnection.tablesLoaded}
                    loading={this.dbConnection.tablesLoaded === undefined}
                    value={this.dbConnection.initialTable || ''}
                    onChange={this.handleInitTableChange}
                  />
                </Grid.Column>
              </Grid.Row>
            </Grid>
          </Modal.Content>
        )}
        {this.dbConnection && (
          <Modal.Actions>
            <Button
              icon="plug"
              labelPosition="left"
              content="Test"
              color="blue"
              loading={this.dbConnection.testConnectionState === RequestState.Waiting}
              onClick={() => this.dbConnection.testConnection()}
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
              trigger={
                <Button icon="trash" labelPosition="left" content="Remove" color="red" />
              }
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
