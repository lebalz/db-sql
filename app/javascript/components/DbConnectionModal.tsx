import React, { Fragment } from 'react';
import { observer, inject } from 'mobx-react';
import DbConnection, { DbType } from '../models/DbConnection';
import { Card, Label, Button, Modal, Header, Form } from 'semantic-ui-react';
import DbConnectionStore from '../stores/db_connection_store';
import { computed } from 'mobx';

interface InjectedProps {
  dbConnectionStore: DbConnectionStore;
}

@inject('dbConnectionStore')
@observer
export default class DbConnectionModal extends React.Component {

  get injected() {
    return this.props as InjectedProps;
  }

  @computed get dbConnection() {
    return this.injected.dbConnectionStore.changingDbConnection;
  }

  render() {
    // const { name, host, port, dbType } = this.dbConnection;
    return (
      <Modal
        open={!!this.dbConnection}
        onClose={() => this.injected.dbConnectionStore.changingDbConnection = null}
      >
        <Modal.Header content="Database Connection" />
        {this.dbConnection &&
          <Modal.Content>
            <Form>
              <Form.Group>
                <Form.Input
                  value={this.dbConnection.name}
                  onChange={e => this.dbConnection!.name = e.target.value}
                  label="Connection Name"
                  type="text"
                />
                <Form.Dropdown
                  value={this.dbConnection.name}
                  options={Object.values(DbType)}
                  onChange={(e, data) => this.dbConnection!.name = data.text!}
                  label="Connection Type"
                  type="text"
                />
              </Form.Group>
            </Form>
          </Modal.Content>
        }
      </Modal>
    )
  }

}