import React, { Fragment } from 'react';
import {
  Segment,
  DropdownProps,
  Button} from 'semantic-ui-react';
import { inject, observer } from 'mobx-react';
import SchemaQueryStore from '../../stores/schema_query_store';
import { computed } from 'mobx';
import SchemaQuery from '../../models/SchemaQuery';
import SqlEditor from '../DatabaseServer/Query/SqlEditor';
import { DbType } from '../../models/DbServer';
import { REST } from '../../declarations/REST';
import cx from 'classnames';
import Tooltip from '../../shared/Tooltip';
import UserStore from '../../stores/user_store';
import SchemaQueryCard from './SchemaQueries/SchemaQueryCard';
import LoadMoreCard from './SchemaQueries/LoadMoreCard';
import Actions from './SchemaQueries/Actions';
import SchemaQueryProps from './SchemaQueries/SchemaQueryProps';

interface InjectedProps {
  schemaQueryStore: SchemaQueryStore;
  userStore: UserStore;
}

@inject('schemaQueryStore', 'userStore')
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

  render() {
    const schemaQueryState = this.injected.schemaQueryStore.fetchRequestState[this.dbType];
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
          <SchemaQueryProps schemaQuery={this.selectedSchemaQuery} />
          <div className="history">
            <div className="cards-container">
              {this.schemaQueries.map((rev) => (
                <SchemaQueryCard
                  key={rev.id}
                  schemaQuery={rev}
                  isActive={this.selectedSchemaQuery?.id === rev.id}
                />
              ))}
              {canLoadMore && <LoadMoreCard />}
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
              <Actions
                schemaQuery={this.selectedSchemaQuery}
                isSaving={this.injected.schemaQueryStore.requestState === REST.Requested}
              />
            </Fragment>
          )}
        </div>
      </Segment>
    );
  }
}
