import React from 'react';
import { DropdownProps, Button, Label } from 'semantic-ui-react';
import { inject, observer } from 'mobx-react';
import { computed } from 'mobx';
import Tooltip from '../shared/Tooltip';
import UserStore from '../stores/user_store';
import SqlQueryStore from '../stores/sql_query_store';
import DbServerStore from '../stores/db_server_store';
import SqlQuery from '../models/SqlQuery';
import SqlQueryProps from './SqlQueries/SqlQueryProps';
import SqlQueryCard from './SqlQueries/SqlQueryCard';

interface Props {
  dbServerId?: string;
  dbName?: string;
  basic?: boolean;
}

interface InjectedProps extends Props {
  userStore: UserStore;
  dbServerStore: DbServerStore;
  sqlQueryStore: SqlQueryStore;
}

@inject('sqlQueryStore', 'dbServerStore', 'userStore')
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
    return queries;
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
          <Label content={this.sqlQueries.length} color="blue" />
        </div>
        <SqlQueryProps sqlQuery={this.selectedSqlQuery} />
        <div className="cards">
          {this.sqlQueries.map((sqlQuery) => (
            <SqlQueryCard key={sqlQuery.id} sqlQuery={sqlQuery} basic={this.props.basic} />
          ))}
        </div>
      </div>
    );
  }
}
