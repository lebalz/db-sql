import React, { Fragment } from 'react';
import { Label, Icon } from 'semantic-ui-react';
import { inject, observer } from 'mobx-react';
import Tooltip from '../../shared/Tooltip';
import { computed } from 'mobx';
import SqlQuery from '../../models/SqlQuery';
import { DbType } from '../../models/DbServer';
import { OwnerType } from '../../api/db_server';
import ClickableIcon from '../../shared/ClickableIcon';
import { PrismCode } from '../Workbench/SqlResult/PrismCode';
import ViewStateStore from '../../stores/view_state_store';
import SqlQueryActions from './SqlQueryActions';

interface Props {
  sqlQuery: SqlQuery;
  basic?: boolean;
}

interface InjectedProps extends Props {
  viewStateStore: ViewStateStore;
}

@inject('viewStateStore')
@observer
export default class SqlQueryCard extends React.Component<Props> {
  get injected() {
    return this.props as InjectedProps;
  }

  @computed
  get sqlQuery() {
    return this.props.sqlQuery;
  }

  render() {
    const ownerType = this.sqlQuery.dbServerOwnerType;
    const isBasic = this.props.basic === true;
    return (
      <div key={this.sqlQuery.id} className="sql-query">
        <div className="card-labels">
          {!isBasic && (
            <Fragment>
              <Label content={this.sqlQuery.dbServerName} color="blue" basic size="mini" pointing="right" />
              <Label
                icon="database"
                content={this.sqlQuery.dbName}
                color="blue"
                basic
                size="mini"
                as="a"
                onClick={() => this.sqlQuery.showInEditor()}
              />
            </Fragment>
          )}
          <div className="spacer" />
          {!isBasic && (
            <SqlQueryActions
              playTooltip="Open in new editor"
              sqlQuery={this.sqlQuery}
              onPlay={() => this.sqlQuery.showInEditor()}
            />
          )}
          <div className="spacer" />
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
          {this.sqlQuery.execTime && (
            <Tooltip delayed position="top right" content={`Executed in ${this.sqlQuery.execTime}s `}>
              <span>
                <Icon className="centered" name="clock" color="black" />
                {` ${this.sqlQuery.execTime.toFixed(2)}s`}
              </span>
            </Tooltip>
          )}
          {!isBasic && (
            <Label
              content={this.sqlQuery.dbServerType}
              color={this.sqlQuery.dbServerType === DbType.Psql ? 'blue' : 'orange'}
              size="mini"
            />
          )}
        </div>
        <div className="meta">{this.sqlQuery.createdAt.toLocaleString()}</div>
        <PrismCode
          code={this.sqlQuery.query}
          language="sql"
          plugins={['line-numbers']}
          style={{ maxHeight: '22em' }}
        />
      </div>
    );
  }
}
