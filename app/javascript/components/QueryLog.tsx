import React from 'react';
import { DropdownProps, Button } from 'semantic-ui-react';
import { inject, observer } from 'mobx-react';
import { computed } from 'mobx';
import Tooltip from '../shared/Tooltip';
import UserStore from '../stores/user_store';
import SqlQueryStore from '../stores/sql_query_store';
import DbServerStore from '../stores/db_server_store';
import SqlQuery from '../models/SqlQuery';
import SqlQueryProps from './SqlQueries/SqlQueryProps';
import SqlQueryCard from './SqlQueries/SqlQueryCard';

interface InjectedProps {
  userStore: UserStore;
  dbServerStore: DbServerStore;
  sqlQueryStore: SqlQueryStore;
}

@inject('sqlQueryStore', 'dbServerStore', 'userStore')
@observer
export default class QueryLog extends React.Component {
  get injected() {
    return this.props as InjectedProps;
  }

  setSqlQuery = (e: React.SyntheticEvent<HTMLElement, Event>, data: DropdownProps) => {
    this.injected.sqlQueryStore.setSelectedSqlQueryId(data.value as string);
  };

  @computed
  get sqlQueries() {
    return this.injected.sqlQueryStore.sqlQueries;
  }

  @computed
  get selectedSqlQuery(): SqlQuery | undefined {
    return this.injected.sqlQueryStore.selectedSqlQuery;
  }

  render() {
    return (
      <div style={{ width: '100%' }}>
        <div className="selection">
          <Tooltip delayed content="Refresh schema query list">
            <Button icon="refresh" size="mini" onClick={() => this.injected.sqlQueryStore.refresh()} />
          </Tooltip>
        </div>
        <SqlQueryProps sqlQuery={this.selectedSqlQuery} />
        <div className="cards">
          {this.sqlQueries.map((sqlQuery) => (
            <SqlQueryCard key={sqlQuery.id} sqlQuery={sqlQuery} />
          ))}
        </div>
      </div>
    );
  }
}
