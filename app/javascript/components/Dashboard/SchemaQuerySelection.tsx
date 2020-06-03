import React, { Fragment } from 'react';
import {
  InputOnChangeData,
  Message,
  Segment,
  Form,
  Header,
  Label,
  DropdownProps,
  Grid
} from 'semantic-ui-react';
import { inject, observer } from 'mobx-react';
import SessionStore, { ApiRequestState } from '../../stores/session_store';
import { TempDbServer } from '../../models/TempDbServer';
import SchemaQueryStore from '../../stores/schema_query_store';
import { computed } from 'mobx';
import SqlEditor from '../DatabaseServer/Query/SqlEditor';
import SchemaQuery from '../../models/SchemaQuery';

interface Props {
  dbServer: TempDbServer;
}

interface InjectedProps extends Props {
  schemaQueryStore: SchemaQueryStore;
}

@inject('schemaQueryStore')
@observer
export default class SchemaQuerySelection extends React.Component<Props> {
  get injected() {
    return this.props as InjectedProps;
  }

  @computed
  get dbServer() {
    return this.props.dbServer;
  }

  setSchemaQuery = (e: React.SyntheticEvent<HTMLElement, Event>, data: DropdownProps) => {
    const value = data.value as string;
    this.dbServer.databaseSchemaQueryId = value;
  };

  @computed
  get schemaQueryOptions() {
    return this.injected.schemaQueryStore.queriesFor(this.dbServer.dbType).map((q) => {
      const name = q.isDefault ? 'Default' : q.name;
      return {
        key: q.id,
        text: name,
        value: q.id
      };
    });
  }

  @computed
  get selectedSchemaQuery(): SchemaQuery | undefined {
    return this.injected.schemaQueryStore.find(this.dbServer.databaseSchemaQueryId);
  }

  render() {
    return (
      <Segment>
        <Grid stackable textAlign="center" columns="equal">
          <Grid.Column width="3">
            <Label as="a" color="teal" ribbon content="Database Schema Query" />
            <Form.Dropdown
              options={this.schemaQueryOptions}
              placeholder="Schema Query"
              search
              selection
              fluid
              value={this.dbServer.databaseSchemaQueryId}
              onChange={this.setSchemaQuery}
            />
          </Grid.Column>
          <Grid.Column>
            {this.selectedSchemaQuery && (
              <SqlEditor readOnly={true} sql={this.selectedSchemaQuery} height={250} />
            )}
          </Grid.Column>
        </Grid>
      </Segment>
    );
  }
}
