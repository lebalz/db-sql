import React from 'react';
import { inject, observer } from 'mobx-react';
import { computed } from 'mobx';
import SqlQuery from '../../models/SqlQuery';
import { OwnerType } from '../../api/db_server';
import ViewStateStore from '../../stores/view_state_store';
import Tooltip from '../../shared/Tooltip';
import { Icon, Label } from 'semantic-ui-react';
import { DbType } from '../../models/DbServer';

interface Props {
  sqlQuery: SqlQuery;
  labels?: QueryLabels[];
  exclude?: QueryLabels[];
}

interface InjectedProps extends Props {
  viewStateStore: ViewStateStore;
}

export enum QueryLabels {
  ExecutionState = 'execution_state',
  DbType = 'db_type',
  OwnerType = 'owner_type',
  ExecTime = 'exec_time'
}

@inject('viewStateStore')
@observer
export default class SqlQueryLabels extends React.Component<Props> {
  get injected() {
    return this.props as InjectedProps;
  }

  @computed
  get sqlQuery() {
    return this.props.sqlQuery;
  }

  get queryLabels(): QueryLabels[] {
    const exclude = this.props.exclude || [];
    if (this.props.labels) {
      return this.props.labels.filter((l) => !exclude.includes(l));
    }
    return Object.values(QueryLabels).filter((l) => !exclude.includes(l));
  }

  render() {
    const ownerType = this.sqlQuery.dbServerOwnerType;

    return (
      <div className="query-labels">
        {this.queryLabels.includes(QueryLabels.ExecutionState) && (
          <Tooltip
            delayed
            position="top right"
            content={this.sqlQuery.isValid ? 'Successful executed' : 'Execution resulted in errors'}
          >
            <Icon
              className="centered"
              name={this.sqlQuery.isValid ? 'check' : 'close'}
              color={this.sqlQuery.isValid ? 'green' : 'red'}
            />
          </Tooltip>
        )}
        {this.queryLabels.includes(QueryLabels.OwnerType) && ownerType && (
          <Tooltip
            delayed
            position="top right"
            content={
              ownerType === OwnerType.Group
                ? 'Executed on a shared db connection'
                : 'Executed on a personal db connection'
            }
          >
            <Icon className="centered" name={ownerType === OwnerType.Group ? 'group' : 'user'} />
          </Tooltip>
        )}
        {this.queryLabels.includes(QueryLabels.ExecTime) && this.sqlQuery.execTime && (
          <Tooltip delayed position="top right" content={`Executed in ${this.sqlQuery.execTime}s`}>
            <span>
              <Icon className="centered" name="clock" color="black" />
              {`${this.sqlQuery.execTime.toFixed(2)}s`}
            </span>
          </Tooltip>
        )}
        {this.queryLabels.includes(QueryLabels.DbType) && (
          <Label
            content={this.sqlQuery.dbServerType}
            color={this.sqlQuery.dbServerType === DbType.Psql ? 'blue' : 'orange'}
            size="mini"
          />
        )}
      </div>
    );
  }
}
