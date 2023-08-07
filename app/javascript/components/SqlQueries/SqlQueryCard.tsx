import React from 'react';
import { Label } from 'semantic-ui-react';
import { inject, observer } from 'mobx-react';
import { computed } from 'mobx';
import SqlQuery from '../../models/SqlQuery';
import { DbType } from '../../models/DbServer';
import { PrismCode } from '../Workbench/SqlResult/PrismCode';
import ViewStateStore from '../../stores/view_state_store';
import SqlQueryActions from './SqlQueryActions';
import SqlQueryLabels, { QueryLabels } from './SqlQueryLabels';
import SqlQueryErrors from './SqlQueryErrors';
import { OwnerType } from '../../api/db_server';

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
    const color = this.sqlQuery.dbServerType === DbType.MySql ? 'orange' : 'blue';
    return (
      <div key={this.sqlQuery.id} className="sql-query">
        <div className="card-labels">
          {!isBasic && (
            <div style={{ width: '15em', overflowX: 'hidden' }}>
              <div style={{ width: 'max-content' }}>
                <Label
                  icon={ownerType === OwnerType.Group ? 'group' : 'user'}
                  content={this.sqlQuery.dbServerName}
                  color={color}
                  basic
                  size="mini"
                  pointing="right"
                />
                <Label
                  icon="database"
                  content={this.sqlQuery.dbName}
                  color={color}
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
          code={this.sqlQuery.preview}
          language="sql"
          plugins={['line-numbers']}
          style={{ maxHeight: '22em', fontSize: 'smaller' }}
          trim
        />
        <SqlQueryErrors sqlQuery={this.sqlQuery} />
      </div>
    );
  }
}
