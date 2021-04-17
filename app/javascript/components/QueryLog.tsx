import React from 'react';
import { DropdownProps, Button, Label, Dropdown, Menu, Checkbox } from 'semantic-ui-react';
import { inject, observer } from 'mobx-react';
import { computed } from 'mobx';
import Tooltip from '../shared/Tooltip';
import UserStore from '../stores/user_store';
import SqlQueryStore from '../stores/sql_query_store';
import DbServerStore from '../stores/db_server_store';
import SqlQuery from '../models/SqlQuery';
import SqlQueryProps from './SqlQueries/SqlQueryProps';
import SqlQueryCard from './SqlQueries/SqlQueryCard';
import _, { size } from 'lodash';
import DbServer, { DbType } from '../models/DbServer';
import ViewStateStore from '../stores/view_state_store';

interface Props {
  dbServerId?: string;
  dbName?: string;
  groupId?: string;
  basic?: boolean;
}

interface InjectedProps extends Props {
  dbServerStore: DbServerStore;
  sqlQueryStore: SqlQueryStore;
  viewStateStore: ViewStateStore;
}

@inject('sqlQueryStore', 'dbServerStore', 'viewStateStore')
@observer
export default class QueryLog extends React.Component<Props> {
  get injected() {
    return this.props as InjectedProps;
  }

  setSqlQuery = (e: React.SyntheticEvent<HTMLElement, Event>, data: DropdownProps) => {
    this.injected.sqlQueryStore.setSelectedSqlQueryId(data.value as string);
  };

  @computed
  get sqlQueries() {
    let queries = this.injected.sqlQueryStore.sqlQueries;
    if (this.props.dbServerId) {
      queries = queries.filter((query) => query.dbServerId === this.props.dbServerId);
    }
    if (this.props.dbName) {
      queries = queries.filter((query) => query.dbName === this.props.dbName);
    }
    if (this.props.groupId) {
      queries = queries.filter((query) => query.ownerId === this.props.groupId);
    }
    return queries;
  }

  @computed
  get filteredSqlQueries() {
    let queries = this.sqlQueries.slice();
    const { sqlQueryLogFilter } = this.injected.viewStateStore;
    if (sqlQueryLogFilter.executionState) {
      const eqTo = sqlQueryLogFilter.executionState === 'success' ? true : false;
      queries = queries.filter((q) => q.isValid === eqTo);
    }
    if (sqlQueryLogFilter.dbServerId) {
      queries = queries.filter((q) => q.dbServerId === sqlQueryLogFilter.dbServerId);
    }
    if (sqlQueryLogFilter.dbName) {
      queries = queries.filter((q) => q.dbName === sqlQueryLogFilter.dbName);
    }
    return queries;
  }
  @computed
  get selectedSqlQuery(): SqlQuery | undefined {
    return this.injected.sqlQueryStore.selectedSqlQuery;
  }

  @computed
  get dbServers() {
    const dbs = this.sqlQueries.filter((q) => q.dbServer).map((q) => q.dbServer) as DbServer[];
    return _.orderBy(_.uniqBy(dbs, 'id'), ['name'], ['asc']).map((s) => {
      return {
        key: s.id,
        text: s.name,
        value: s.id,
        label: { color: s.dbType === DbType.MySql ? 'orange' : 'blue', empty: true, circular: true }
      };
    });
  }

  @computed
  get dbNames() {
    const { dbServerId } = this.injected.viewStateStore.sqlQueryLogFilter;

    const dbs = this.sqlQueries
      .filter((q) => q.dbServer && q.dbServerId === dbServerId)
      .map((q) => q.dbName) as string[];
    return _.uniq(dbs)
      .sort()
      .map((db) => {
        return {
          key: db,
          text: db,
          value: db
        };
      });
  }

  onDbServerChange = (event: React.SyntheticEvent<HTMLElement, Event>, data: DropdownProps) => {
    this.injected.viewStateStore.sqlQueryLogFilter.setDbServerId(data.value as string);
  };

  onDbNameChange = (event: React.SyntheticEvent<HTMLElement, Event>, data: DropdownProps) => {
    this.injected.viewStateStore.sqlQueryLogFilter.setDbName(data.value as string);
  };

  render() {
    const { executionState } = this.injected.viewStateStore.sqlQueryLogFilter;
    return (
      <div style={{ width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
          <Tooltip delayed content="Refresh">
            <Button icon="refresh" size="mini" onClick={() => this.injected.sqlQueryStore.refresh()} />
          </Tooltip>
          <Label
            content={this.filteredSqlQueries.length}
            color="blue"
            style={{ verticalAlign: 'text-bottom' }}
          />
          <div className="spacer" />

          <Tooltip delayed content="Query execution state">
            <Button.Group size="mini">
              <Button
                color="green"
                basic={executionState !== 'success'}
                onClick={() => this.injected.viewStateStore.sqlQueryLogFilter.toggleSuccess()}
                icon="check"
              />
              <Button
                color="red"
                basic={executionState !== 'error'}
                onClick={() => this.injected.viewStateStore.sqlQueryLogFilter.toggleError()}
                icon="times"
              />
            </Button.Group>
          </Tooltip>
          <div className="spacer" />

          <Menu compact size="mini">
            <Dropdown
              options={this.dbServers}
              selection
              item
              clearable
              placeholder="Connection"
              onChange={this.onDbServerChange}
            />
          </Menu>
          {this.injected.viewStateStore.sqlQueryLogFilter.dbServerId && (
            <Menu compact size="mini">
              <Dropdown
                options={this.dbNames}
                selection
                item
                clearable
                placeholder="Database"
                onChange={this.onDbNameChange}
              />
            </Menu>
          )}
        </div>
        <SqlQueryProps sqlQuery={this.selectedSqlQuery} />
        <div className="cards">
          {this.filteredSqlQueries.map((sqlQuery) => (
            <SqlQueryCard key={sqlQuery.id} sqlQuery={sqlQuery} basic={this.props.basic} />
          ))}
        </div>
      </div>
    );
  }
}
