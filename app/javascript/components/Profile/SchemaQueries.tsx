import React, { Fragment, SyntheticEvent } from 'react';
import {
  Segment,
  Form,
  Grid,
  DropdownProps,
  Button,
  Card,
  Label,
  Icon,
  Input,
  InputOnChangeData,
  TextArea,
  TextAreaProps
} from 'semantic-ui-react';
import { inject, observer } from 'mobx-react';
import SessionStore from '../../stores/session_store';
import SchemaQueryStore from '../../stores/schema_query_store';
import { computed } from 'mobx';
import SchemaQuery from '../../models/SchemaQuery';
import SqlEditor from '../DatabaseServer/Query/SqlEditor';
import { DbType } from '../../models/DbServer';
import { REST } from '../../declarations/REST';
import cx from 'classnames';
import Tooltip from '../../shared/Tooltip';
import UserStore from '../../stores/user_store';
import SchemaQueryCard from './SchemaQueryCard';

interface InjectedProps {
  sessionStore: SessionStore;
  schemaQueryStore: SchemaQueryStore;
  userStore: UserStore;
}

@inject('sessionStore', 'schemaQueryStore', 'userStore')
@observer
export default class SchemaQueries extends React.Component {
  get injected() {
    return this.props as InjectedProps;
  }

  componentDidMount() {
    this.injected.userStore.setShowAdvancedSettings(true);
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
    return this.injected.schemaQueryStore.schemaQueries;
  }

  @computed
  get selectedSchemaQuery(): SchemaQuery | undefined {
    return this.injected.schemaQueryStore.selectedSchemaQuery;
  }

  onChangeName = (event: SyntheticEvent<HTMLInputElement>, data: InputOnChangeData) => {
    event.preventDefault();
    if (this.selectedSchemaQuery) {
      this.selectedSchemaQuery.name = data.value;
    }
  };

  onChangeDescription = (event: React.FormEvent<HTMLTextAreaElement>, data: TextAreaProps) => {
    event.preventDefault();
    if (this.selectedSchemaQuery) {
      this.selectedSchemaQuery.description = data.value?.toString() ?? '';
    }
  };

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
            <Button
              icon="add"
              size="mini"
              onClick={() => this.injected.schemaQueryStore.addEmptySchemaQuery()}
            />
          </div>
          <div className="schema-name">
            <Input
              value={this.selectedSchemaQuery?.name ?? ''}
              onChange={this.onChangeName}
              disabled={this.selectedSchemaQuery?.isDefault}
              placeholder="Title..."
            />
          </div>
          <div className="schema-description">
            <TextArea
              value={this.selectedSchemaQuery?.description ?? ''}
              onChange={this.onChangeDescription}
              rows={Math.max(this.selectedSchemaQuery?.description?.split('\n').length ?? 0, 2)}
              disabled={this.selectedSchemaQuery?.isDefault}
              placeholder="Description..."
            />
          </div>
          <div className="history">
            <div className="cards-container">
              {this.schemaQueries.map((rev) => (
                <SchemaQueryCard
                  key={rev.id}
                  schemaQuery={rev}
                  isActive={this.selectedSchemaQuery?.id === rev.id}
                />
              ))}
            </div>
          </div>
          {this.selectedSchemaQuery && (
            <Fragment>
              <SqlEditor
                className="editor"
                sql={this.selectedSchemaQuery}
                readOnly={this.selectedSchemaQuery.isDefault}
              />
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
