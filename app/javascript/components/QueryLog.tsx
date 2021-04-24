import React from 'react';
import { DropdownProps } from 'semantic-ui-react';
import { inject, observer } from 'mobx-react';
import { computed } from 'mobx';
import SqlQueryStore from '../stores/sql_query_store';
import DbServerStore from '../stores/db_server_store';
import SqlQuery from '../models/SqlQuery';
import SqlQueryFilter from './SqlQueries/SqlQueryFilter';
import SqlQueryCard from './SqlQueries/SqlQueryCard';
import _ from 'lodash';
import ViewStateStore from '../stores/view_state_store';
import GroupStore from '../stores/group_store';

interface Props {
  groupId?: string;
  basic?: boolean;
  filter?: boolean;
}

interface InjectedProps extends Props {
  dbServerStore: DbServerStore;
  sqlQueryStore: SqlQueryStore;
  viewStateStore: ViewStateStore;
  groupStore: GroupStore;
}

@inject('sqlQueryStore', 'dbServerStore', 'viewStateStore', 'groupStore')
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
    let queries = this.props.filter
      ? this.injected.sqlQueryStore.filteredSqlQueries
      : this.injected.sqlQueryStore.sqlQueries;
    if (this.props.groupId) {
      queries = queries.filter((query) => query.ownerId === this.props.groupId);
    }
    return queries;
  }

  @computed
  get selectedSqlQuery(): SqlQuery | undefined {
    return this.injected.sqlQueryStore.selectedSqlQuery;
  }

  render() {
    return (
      <div style={{ width: '100%' }}>
        {this.props.filter && <SqlQueryFilter groupId={this.props.groupId} />}
        <div className="cards">
          {this.sqlQueries.map((sqlQuery) => (
            <SqlQueryCard key={sqlQuery.id} sqlQuery={sqlQuery} basic={this.props.basic} />
          ))}
        </div>
      </div>
    );
  }
}
