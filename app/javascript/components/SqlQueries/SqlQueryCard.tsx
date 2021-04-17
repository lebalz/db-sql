import React, { Fragment } from 'react';
import { Label, Icon } from 'semantic-ui-react';
import { inject, observer } from 'mobx-react';
import Tooltip from '../../shared/Tooltip';
import { computed } from 'mobx';
import SqlQuery from '../../models/SqlQuery';
import { DbType } from '../../models/DbServer';
import { PrismCode } from '../Workbench/SqlResult/PrismCode';
import ViewStateStore from '../../stores/view_state_store';
import SqlQueryActions from './SqlQueryActions';
import SqlQueryLabels, { QueryLabels } from './SqlQueryLabels';
import SqlQueryErrors from './SqlQueryErrors';

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
            <div style={{ width: '15em', overflowX: 'hidden' }}>
              <div style={{ width: 'max-content' }}>
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
              </div>
            </div>
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
          <SqlQueryLabels
            sqlQuery={this.sqlQuery}
            exclude={isBasic ? [QueryLabels.ExecTime, QueryLabels.OwnerType] : []}
          />
        </div>
        <div className="meta">{this.sqlQuery.createdAt.toLocaleString()}</div>
        <PrismCode
          code={this.sqlQuery.query}
          language="sql"
          plugins={['line-numbers']}
          style={{ maxHeight: '22em', fontSize: 'smaller' }}
        />
        <SqlQueryErrors sqlQuery={this.sqlQuery} />
      </div>
    );
  }
}
