import React from 'react';
import { observer, inject } from 'mobx-react';
import { DbType, QueryState } from '../models/DbConnection';
import { Label, Button, Modal, Form, Grid, DropdownProps } from 'semantic-ui-react';
import DbConnectionStore from '../stores/db_connection_store';
import { computed, reaction } from 'mobx';
import { updateConnection } from '../api/db_connection';
import _ from 'lodash';
import { RequestState } from '../stores/session_store';
import { TempDbConnectionRole } from '../models/TempDbConnection';

interface InjectedProps {
  dbConnectionStore: DbConnectionStore;
}

@inject('dbConnectionStore')
@observer
export default class DbConnectionEdit extends React.Component {

  constructor(props: any) {
    super(props);

    reaction(
      () => (this.injected.dbConnectionStore.saveState),
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
    showPassword: false
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
      ...this.dbConnection.databases.map(db => db.name),
      this.dbConnection.initialDb
    ]).map((name) => {
      return { key: `db-${name}`, text: name, value: name };
    });
  }

  @computed get dbTableOptions() {
    return _.uniq([
      undefined,
      ...this.dbConnection.tables.map(table => table.name),
      this.dbConnection.initialSchema
    ]).map((name) => {
      return { key: `table-${name}`, text: name, value: name };
    });
  }

  onClose() {
    this.setState({ showPassword: false });
    this.injected.dbConnectionStore.tempDbConnection = null;
  }

  handleInitDbChange = (e: React.SyntheticEvent<HTMLElement, Event>, data: DropdownProps) => {
    const value = data.value as (string | undefined);
    this.dbConnection.initialDb = value;
  }

  handleInitSchemaChange = (e: React.SyntheticEvent<HTMLElement, Event>, data: DropdownProps) => {
    const value = data.value as (string | undefined);
    this.dbConnection.initialSchema = value;
  }

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

  render() {
    // const { name, host, port, dbType } = this.dbConnection;
    return (
      <Modal
        open={this.isModalOpen}
        onClose={() => this.onClose()}
      >
        <Modal.Header content="Database Connection" />
        {this.isModalOpen &&
          <Modal.Content id="db-connection-modal">
            <Grid stackable columns={2}>
              <Grid.Row>
                <Grid.Column>
                  <Label
                    as="a"
                    color="teal"
                    ribbon
                    content="Display Name"
                  />
                  <Form.Input
                    fluid
                    value={this.dbConnection.name}
                    onChange={e => this.dbConnection.name = e.target.value}
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
                    <Button.Group
                      color="teal"
                    >
                      <Button
                        content="PostgreSQl"
                        active={this.dbConnection.dbType === DbType.Psql}
                        onClick={() => this.dbConnection.dbType = DbType.Psql}
                      />
                      <Button
                        content="MySql"
                        active={this.dbConnection.dbType === DbType.MySql}
                        onClick={() => this.dbConnection.dbType = DbType.MySql}
                      />
                    </Button.Group>
                  </div>
                </Grid.Column>
              </Grid.Row>
              <Grid.Row>
                <Grid.Column>
                  <Label
                    as="a"
                    color="teal"
                    ribbon
                    content="Host: Port"
                  />
                  <Form>
                    <Form.Group inline widths="1">
                      <Form.Input
                        required
                        value={this.dbConnection.host}
                        onChange={e => this.dbConnection.host = e.target.value}
                        type="text"
                      />
                      <Form.Input
                        required
                        style={{ width: '6rem' }}
                        value={this.dbConnection.port}
                        onChange={e => this.dbConnection.port = parseInt(e.target.value, 10)}
                        type="number"
                      />
                    </Form.Group>
                  </Form>
                </Grid.Column>
              </Grid.Row>
              <Grid.Row>
                <Grid.Column>
                  <Label
                    as="a"
                    color="teal"
                    ribbon
                    content="Username"
                  />
                  <Form.Input
                    fluid
                    required
                    placeholder="Username"
                    value={this.dbConnection.username}
                    onChange={e => this.dbConnection.username = e.target.value}
                    type="text"
                  />
                </Grid.Column>
                <Grid.Column>
                  <Label
                    as="a"
                    color="teal"
                    ribbon
                    content="Password"
                  />
                  <Form.Input
                    fluid
                    required
                    icon={{
                      name: 'eye',
                      circular: true,
                      link: true,
                      onClick: () => this.setState({
                        showPassword: !this.state.showPassword
                      })
                    }}
                    placeholder="Password"
                    value={this.dbConnection.password || ''}
                    loading={this.dbConnection.password === undefined}
                    onChange={e => this.dbConnection.password = e.target.value}
                    type={this.state.showPassword ? 'text' : 'password'}
                  />
                </Grid.Column>
              </Grid.Row>
              <Grid.Row>
                <Grid.Column>
                  <Label
                    as="a"
                    color="teal"
                    ribbon
                    content="Initial DB (optional)"
                  />
                  <Form.Dropdown
                    options={this.dbNameOptions}
                    placeholder="Initial DB"
                    search
                    selection
                    fluid
                    allowAdditions
                    value={this.dbConnection.initialDb || ''}
                    onChange={this.handleInitDbChange}
                  />
                </Grid.Column>
                <Grid.Column>
                  <Label
                    as="a"
                    color="teal"
                    ribbon
                    content="Initial Table (optional)"
                  />
                  <Form.Dropdown
                    options={this.dbTableOptions}
                    placeholder="Initial Schema"
                    search
                    selection
                    fluid
                    allowAdditions
                    value={this.dbConnection.initialSchema || ''}
                    onChange={this.handleInitSchemaChange}
                  />
                </Grid.Column>
              </Grid.Row>
              <Grid.Row>
                <Grid.Column>
                  <Button
                    content="Test"
                    color="blue"
                    floated="left"
                    loading={this.dbConnection.queryState === QueryState.Executing}
                    onClick={() => this.dbConnection.testConnection()}
                  />
                </Grid.Column>
                <Grid.Column>
                  <Button
                    content="Save"
                    color="green"
                    floated="right"
                    onClick={() => this.onSave()}
                  />
                  <Button
                    content="Cancel"
                    color="red"
                    floated="right"
                    onClick={() => this.onClose()}
                  />
                </Grid.Column>
              </Grid.Row>
            </Grid>
          </Modal.Content>
        }
      </Modal>
    )
  }

}