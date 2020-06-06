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
  TextAreaProps,
  Modal,
  Popup
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
    const schemaQueryState = this.injected.schemaQueryStore.fetchRequestState[this.dbType];
    const isLoading = schemaQueryState.state === REST.Requested;
    const canLoadMore = schemaQueryState.available !== schemaQueryState.loaded;
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
            <Tooltip delayed content="Refresh schema query list">
              <Button icon="refresh" size="mini" onClick={() => this.injected.schemaQueryStore.refresh()} />
            </Tooltip>
            <Tooltip delayed content="Add a new schema query">
              <Button
                icon="add"
                size="mini"
                onClick={() => this.injected.schemaQueryStore.addEmptySchemaQuery()}
              />
            </Tooltip>
          </div>
          <div
            className={cx('schema-name', {
              ['dirty-right']: this.selectedSchemaQuery?.name !== this.selectedSchemaQuery?.pristineState.name
            })}
          >
            <Input
              value={this.selectedSchemaQuery?.name ?? ''}
              onChange={this.onChangeName}
              disabled={!this.selectedSchemaQuery?.canEdit}
              placeholder="Title..."
            />
          </div>
          <div
            className={cx('schema-description', {
              ['dirty-right']:
                this.selectedSchemaQuery?.description !== this.selectedSchemaQuery?.pristineState.description
            })}
          >
            <TextArea
              value={this.selectedSchemaQuery?.description ?? ''}
              onChange={this.onChangeDescription}
              rows={Math.max(this.selectedSchemaQuery?.description?.split('\n').length ?? 0, 2)}
              disabled={!this.selectedSchemaQuery?.canEdit}
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
              {canLoadMore && (
                <Card
                  onClick={() => this.injected.schemaQueryStore.loadNextBatch(this.dbType)}
                  className="schema-query-card"
                >
                  <Card.Content>
                    <Card.Header textAlign="center">
                      <Icon name={isLoading ? 'circle notch' : 'plus'} circular loading={isLoading} />
                    </Card.Header>
                    <Card.Description>Load more Queries</Card.Description>
                  </Card.Content>
                </Card>
              )}
            </div>
          </div>
          {this.selectedSchemaQuery && (
            <Fragment>
              <SqlEditor
                className={cx('editor', {
                  ['dirty']: this.selectedSchemaQuery.query !== this.selectedSchemaQuery.pristineState.query
                })}
                sql={this.selectedSchemaQuery}
                readOnly={!this.selectedSchemaQuery.canEdit}
              />
              <div className="actions">
                {this.selectedSchemaQuery.isDirty && this.selectedSchemaQuery.isPersisted && (
                  <Button
                    icon="cancel"
                    labelPosition="left"
                    content="Cancel"
                    color="black"
                    onClick={() => this.selectedSchemaQuery?.restore()}
                  />
                )}
                <Button
                  className={cx('toggle-privacy', {
                    ['dirty']:
                      this.selectedSchemaQuery.isPrivate !== this.selectedSchemaQuery.pristineState.is_private
                  })}
                  icon={this.selectedSchemaQuery.isPrivate ? 'lock' : 'lock open'}
                  labelPosition="left"
                  color="yellow"
                  disabled={
                    !this.selectedSchemaQuery?.canEdit ||
                    (this.selectedSchemaQuery.isPublic &&
                      this.selectedSchemaQuery.stats.public_user_count > 0)
                  }
                  onClick={() => this.selectedSchemaQuery?.togglePrivacy()}
                  content={this.selectedSchemaQuery.isPrivate ? 'Private' : 'Public'}
                />

                <Popup
                  on="click"
                  position="top right"
                  trigger={
                    <Button
                      disabled={
                        !this.selectedSchemaQuery?.canEdit ||
                        this.selectedSchemaQuery.stats.public_user_count > 0
                      }
                      icon="trash"
                      labelPosition="left"
                      content="Remove"
                      color="red"
                    />
                  }
                  header="Confirm"
                  content={
                    <Button
                      icon="trash"
                      labelPosition="left"
                      content="Yes Delete"
                      color="red"
                      onClick={() => this.selectedSchemaQuery?.destroy()}
                    />
                  }
                />
                <Button
                  icon="save"
                  labelPosition="left"
                  color="green"
                  loading={this.injected.schemaQueryStore.requestState === REST.Requested}
                  disabled={!this.selectedSchemaQuery.isDirty}
                  style={{ marginRight: 0 }}
                  onClick={() => this.selectedSchemaQuery?.save()}
                  content="Save"
                />
              </div>
            </Fragment>
          )}
        </div>
      </Segment>
    );
  }
}
