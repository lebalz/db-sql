import React, {  } from 'react';
import {
  Button,
  Dropdown,
  DropdownItemProps,
  DropdownProps,
  Label,
  Menu
} from 'semantic-ui-react';
import { inject, observer } from 'mobx-react';
import SqlQuery from '../../models/SqlQuery';
import Tooltip from '../../shared/Tooltip';
import DbServerStore from '../../stores/db_server_store';
import GroupStore from '../../stores/group_store';
import SqlQueryStore from '../../stores/sql_query_store';
import ViewStateStore from '../../stores/view_state_store';
import { computed } from 'mobx';
import _ from 'lodash';
import DbServer, { DbType } from '../../models/DbServer';
import { OwnerType } from '../../api/db_server';

interface Props {
  sqlQuery?: SqlQuery;
  groupId?: string;
}

interface InjectedProps extends Props {
  dbServerStore: DbServerStore;
  sqlQueryStore: SqlQueryStore;
  viewStateStore: ViewStateStore;
  groupStore: GroupStore;
}

@inject('sqlQueryStore', 'dbServerStore', 'viewStateStore', 'groupStore')
@observer
export default class SqlQueryFilter extends React.Component<Props> {
  get injected() {
    return this.props as InjectedProps;
  }

  get selectedSqlQuery(): SqlQuery | undefined {
    return this.props.sqlQuery;
  }

  @computed
  get sqlQueries() {
    if (!this.props.groupId) {
      return this.injected.sqlQueryStore.sqlQueries;
    }
    return this.injected.sqlQueryStore.sqlQueries.filter((query) => query.ownerId === this.props.groupId);
  }

  @computed
  get dbServers(): DropdownItemProps[] {
    const dbs = this.sqlQueries.filter((q) => q.dbServer).map((q) => q.dbServer) as DbServer[];
    return _.orderBy(_.uniqBy(dbs, 'id'), ['name'], ['asc']).map((s) => {
      const owner = s.ownerType === OwnerType.Group ? this.injected.groupStore.find(s.ownerId) : undefined;
      return {
        key: s.id,
        text: s.name,
        value: s.id,
        description: owner?.name,
        icon: {
          color: s.dbType === DbType.MySql ? 'orange' : 'blue',
          name: s.ownerType === OwnerType.Group ? 'group' : 'user',
          size: 'mini'
        }
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
    let cnt: number = 0;
    if (this.props.groupId) {
      cnt = this.injected.sqlQueryStore.filteredSqlQueries.filter(
        (query) => query.ownerId === this.props.groupId
      ).length;
    } else {
      cnt = this.injected.sqlQueryStore.filteredSqlQueries.length;
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
        <Tooltip delayed content="Refresh">
          <Button icon="refresh" size="mini" onClick={() => this.injected.sqlQueryStore.refresh()} />
        </Tooltip>
        <Label content={cnt} color="blue" style={{ verticalAlign: 'text-bottom' }} />
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
    );
  }
}
