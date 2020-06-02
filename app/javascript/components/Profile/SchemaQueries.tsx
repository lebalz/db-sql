import React, { Fragment } from 'react';
import { Segment, Form, Grid, DropdownProps, Button, Card } from 'semantic-ui-react';
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
  get injected() {
    return this.props as InjectedProps;
  }

  setSchemaQuery = (e: React.SyntheticEvent<HTMLElement, Event>, data: DropdownProps) => {
    this.injected.schemaQueryStore.setSelectedSchemaQueryId(data.value as string);
  };

  @computed
  get default() {
    return this.injected.schemaQueryStore.default(this.dbType);
  }

  @computed
  get dbType() {
    return this.injected.schemaQueryStore.selectedDbType;
  }

  @computed
  get schemaQueries() {
    return this.injected.schemaQueryStore.latestSchemaQueries.filter(
      (q) => !q.isDefault && q.dbType === this.dbType
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
    return this.injected.schemaQueryStore.selectedSchemaQuery;
  }

  render() {
    return (
      <Segment style={{ width: '100%', height: '100%' }}>
        <div id="schema-query-grid">
          <div className="selection">
            <div>
              <Button.Group color="teal" size="mini">
                <Button
                  content="PostgreSQL"
                  active={this.dbType === DbType.Psql}
                  onClick={() => this.injected.schemaQueryStore.setSelectedDbType(DbType.Psql)}
                />
                <Button
                  content="MySql"
                  active={this.dbType === DbType.MySql}
                  onClick={() => this.injected.schemaQueryStore.setSelectedDbType(DbType.MySql)}
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
                value={this.selectedSchemaQuery?.latestRevision.id}
                onChange={this.setSchemaQuery}
              />
            )}
            <Button
              icon="add"
              onClick={() => this.injected.schemaQueryStore.setSelectedSchemaQueryId(this.default.id)}
            />
          </div>
          <div className="history">
            <div className="cards-container">
              {this.selectedSchemaQuery?.revisions.reverse().map((rev) => {
                return (
                  <Card
                    key={rev.id}
                    color={rev.id === this.selectedSchemaQuery?.id ? 'teal' : undefined}
                    onClick={() => this.injected.schemaQueryStore.setSelectedSchemaQueryId(rev.id)}
                  >
                    <Card.Content>
                      <Card.Description>Nr. {rev.revisionNumber}</Card.Description>
                      <Card.Meta>
                        {rev.createdAt.toLocaleString('de-CH')}
                        <br />
                        {rev.id}
                      </Card.Meta>
                    </Card.Content>
                    {rev.nextRevisionIds.length > 1 &&
                      rev.revisionNumber >= this.selectedSchemaQuery!.revisionNumber && (
                        <Card.Content extra>
                          <Button.Group size="mini">
                            <Button
                              icon="left arrow"
                              onClick={() => rev.rotateToNextRevisionBranch('backward')}
                            />
                            <Button.Or text={`${rev.branchPosition + 1}/${rev.nextRevisionIds.length}`} />
                            <Button
                              icon="right arrow"
                              onClick={() => rev.rotateToNextRevisionBranch('forward')}
                            />
                          </Button.Group>
                        </Card.Content>
                      )}
                  </Card>
                );
              })}
            </div>
          </div>
          {this.selectedSchemaQuery && (
            <Fragment>
              <SqlEditor className="editor" sql={this.selectedSchemaQuery} />
              <div className="actions">
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
              </div>
            </Fragment>
          )}
        </div>
      </Segment>
    );
  }
}
