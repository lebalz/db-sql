import React from 'react';
import { Label, Icon } from 'semantic-ui-react';
import { inject, observer } from 'mobx-react';
import Tooltip from '../../../shared/Tooltip';
import { computed } from 'mobx';
import SqlQueryStore from '../../../stores/sql_query_store';
import SqlQuery from '../../../models/SqlQuery';
import { DbType } from '../../../models/DbServer';
import SqlEditor from '../../DatabaseServer/Query/SqlEditor';
import RouterStore from '../../../stores/router_store';
import DbServerStore from '../../../stores/db_server_store';
import Database from '../../../models/Database';

interface Props {
  sqlQuery: SqlQuery;
}

interface InjectedProps extends Props {
  sqlQueryStore: SqlQueryStore;
  routerStore: RouterStore;
  dbServerStore: DbServerStore;
}

@inject('sqlQueryStore', 'routerStore', 'dbServerStore')
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
    return (
      <div key={this.sqlQuery.id} className="sql-query">
        <div className="card-labels">
          <Label content={this.sqlQuery.dbServerName} color="blue" basic size="mini" pointing="right" />
          <Label
            icon="database"
            content={this.sqlQuery.dbName}
            color="blue"
            basic
            size="mini"
            as="a"
            onClick={() => {
              this.injected.routerStore.push(
                `/connections/${this.sqlQuery.dbServerId}/${this.sqlQuery.dbName}`
              );
              if (this.sqlQuery.database) {
                const query = this.sqlQuery.database.addQuery();
                query.query = this.sqlQuery.query;
                query.setActive();
              } else {
                this.injected.dbServerStore.addOnDbLoadTask(
                  this.sqlQuery.dbServerId,
                  this.sqlQuery.dbName,
                  (db: Database) => {
                    const query = db.addQuery();
                    query.query = this.sqlQuery.query;
                    query.setActive();
                  }
                );
              }
            }}
          />
          <div className="spacer" />
          <Tooltip
            delayed
            position="top right"
            content={this.sqlQuery.isValid ? 'Successful executed' : 'Execution resulted in errors'}
          >
            <Icon
              name={this.sqlQuery.isValid ? 'check' : 'close'}
              color={this.sqlQuery.isValid ? 'green' : 'red'}
              circular
              size="tiny"
            />
          </Tooltip>
          <Label
            content={this.sqlQuery.dbServerType}
            color={this.sqlQuery.dbServerType === DbType.Psql ? 'blue' : 'orange'}
            size="mini"
          />
        </div>
        <div className="meta">{this.sqlQuery.createdAt.toLocaleString()}</div>
        <SqlEditor
          sql={this.sqlQuery}
          readOnly={true}
          className="editable"
          height={this.sqlQuery.lineCount * 1.4}
          heightUnit="em"
          maxHeight="22em"
          highlightActiveLine={false}
        />
      </div>
    );
  }
}
