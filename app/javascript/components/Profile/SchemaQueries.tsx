import React, { Fragment } from 'react';
import {
  Segment,
  Form,
  Grid,
  DropdownProps,
  Button
} from 'semantic-ui-react';
import { inject, observer } from 'mobx-react';
import SessionStore from '../../stores/session_store';
import SchemaQueryStore from '../../stores/schema_query_store';
import { computed } from 'mobx';
import SchemaQuery from '../../models/SchemaQuery';
import SqlEditor from '../DatabaseServer/Query/SqlEditor';
import { DbType } from '../../models/DbServer';
import { REST } from '../../declarations/REST';

interface InjectedProps {
  sessionStore: SessionStore;
  schemaQueryStore: SchemaQueryStore;
}

@inject('sessionStore', 'schemaQueryStore')
@observer
export default class SchemaQueries extends React.Component {
  state: { schemaQueryId?: string; dbType: DbType } = {
    schemaQueryId: undefined,
    dbType: DbType.Psql
  };

  get injected() {
    return this.props as InjectedProps;
  }

  setSchemaQuery = (e: React.SyntheticEvent<HTMLElement, Event>, data: DropdownProps) => {
    this.setState({
      schemaQueryId: data.value
    });
  };

  @computed
  get default() {
    return this.injected.schemaQueryStore.default(this.state.dbType);
  }

  @computed
  get schemaQueries() {
    return this.injected.schemaQueryStore.latestSchemaQueries.filter(
      (q) => !q.isDefault && q.dbType === this.state.dbType
    );
  }

  @computed
  get schemaQueryOptions() {
    return this.schemaQueries.map((q) => {
      const name = q.updatedAt.toLocaleString('de-CH');
      return {
        key: q.id,
        text: name,
        value: q.id
      };
    });
  }

  @computed
  get selectedSchemaQuery(): SchemaQuery | undefined {
    if (this.state.schemaQueryId) {
      return this.injected.schemaQueryStore.find(this.state.schemaQueryId);
    } else {
      return this.schemaQueries[0];
    }
  }

  render() {
    return (
      <Segment style={{ width: '100%', height: '100%' }}>
        <Grid stackable textAlign="left" columns="equal" style={{ height: '100%' }}>
          <Grid.Column width="3">
            <div>
              <Button.Group color="teal">
                <Button
                  content="PostgreSQL"
                  active={this.state.dbType === DbType.Psql}
                  onClick={() => this.setState({ dbType: DbType.Psql, schemaQueryId: undefined })}
                />
                <Button
                  content="MySql"
                  active={this.state.dbType === DbType.MySql}
                  onClick={() => this.setState({ dbType: DbType.MySql, schemaQueryId: undefined })}
                />
              </Button.Group>
            </div>
            {this.schemaQueries.length > 0 && (
              <Form.Dropdown
                options={this.schemaQueryOptions}
                placeholder="Schema Query"
                search
                selection
                fluid
                value={this.selectedSchemaQuery?.id}
                onChange={this.setSchemaQuery}
              />
            )}
            <Button icon="add" onClick={() => this.setState({ schemaQueryId: this.default.id })} />
          </Grid.Column>
          <Grid.Column>
            {this.selectedSchemaQuery && (
              <Fragment>
                <SqlEditor sql={this.selectedSchemaQuery} />
                <Button
                  positive
                  loading={this.injected.schemaQueryStore.requestState === REST.Requested}
                  disabled={!this.selectedSchemaQuery.isDirty}
                  style={{ marginRight: 0 }}
                  onClick={() => this.selectedSchemaQuery?.save()}
                >
                  Save
                </Button>
                <Button
                  color="red"
                  loading={this.injected.schemaQueryStore.requestState === REST.Requested}
                  disabled={this.selectedSchemaQuery.isDefault}
                  style={{ marginRight: 0 }}
                  onClick={() => this.selectedSchemaQuery?.destroy()}
                >
                  Löschen
                </Button>
              </Fragment>
            )}
          </Grid.Column>
        </Grid>
      </Segment>
    );
  }
}
