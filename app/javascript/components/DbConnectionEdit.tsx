import React from 'react';
import { observer, inject } from 'mobx-react';
import { DbType, QueryState } from '../models/DbConnection';
import { Label, Button, Modal, Form, Grid } from 'semantic-ui-react';
import DbConnectionStore from '../stores/db_connection_store';
import { computed } from 'mobx';
import { updateConnection } from '../api/db_connection';

interface InjectedProps {
  dbConnectionStore: DbConnectionStore;
}

@inject('dbConnectionStore')
@observer
export default class DbConnectionEdit extends React.Component {

  get injected() {
    return this.props as InjectedProps;
  }

  state = {
    showPassword: false
  };

  @computed get dbConnection() {
    return this.injected.dbConnectionStore.editedDbConnection!;
  }

  @computed get isModalOpen() {
    return !!this.injected.dbConnectionStore.editedDbConnection;
  }

  onClose() {
    const { editedDbConnection } = this.injected.dbConnectionStore;
    if (editedDbConnection) {
      editedDbConnection.password = undefined;
    }
    this.setState({ showPassword: false });
    this.injected.dbConnectionStore.editedDbConnection = null;
  }

  onSave() {
    updateConnection(this.dbConnection.params).then(
      () => this.onClose()
    ).catch(
      e => console.log('error on save ', e)
    );
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
                    color={this.dbConnection.dbType === DbType.Psql ? "blue" : "orange"}
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
                        value={this.dbConnection.host}
                        onChange={e => this.dbConnection.host = e.target.value}
                        type="text"
                      />
                      <Form.Input
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
                    loading={!this.dbConnection.password}
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
                  <Form.Input
                    fluid
                    placeholder="Initial Database"
                    value={this.dbConnection.initialDb || ''}
                    onChange={(e) => {
                      this.dbConnection.initialDb = e.target.value.length === 0
                        ? undefined
                        : e.target.value;
                    }}
                    type="text"
                  />
                </Grid.Column>
                <Grid.Column>
                  <Label
                    as="a"
                    color="teal"
                    ribbon
                    content="Initial Table (optional)"
                  />
                  <Form.Input
                    fluid
                    placeholder="Initial Table"
                    value={this.dbConnection.initialSchema || ''}
                    onChange={(e) => {
                      this.dbConnection.initialSchema = e.target.value.length === 0
                        ? undefined
                        : e.target.value;
                    }}
                    type="text"
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
                    content="Dismiss"
                    color="red"
                    floated="right"
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