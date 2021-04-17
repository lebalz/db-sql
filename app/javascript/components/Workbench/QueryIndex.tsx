import { computed } from 'mobx';
import { inject, observer } from 'mobx-react';
import React from 'react';
import { Label, List, Segment } from 'semantic-ui-react';
import Database from '../../models/Database';
import Tooltip from '../../shared/Tooltip';
import SqlQueryStore from '../../stores/sql_query_store';
import { PrismCode } from './SqlResult/PrismCode';

interface Props {
  dbServerId: string;
  dbName: string;
}

interface InjectedProps extends Props {
  sqlQueryStore: SqlQueryStore;
}

@inject('sqlQueryStore')
@observer
export default class QueryIndex extends React.Component<Props> {
  @computed
  get injected() {
    return this.props as InjectedProps;
  }

  @computed
  get queries() {
    return this.injected.sqlQueryStore.findBy(this.props.dbServerId, this.props.dbName);
  }

  render() {
    return (
      <Segment attached>
        <List horizontal>
          {this.queries.map((q, idx) => {
            return (
              <List.Item key={idx}>
                <Tooltip
                  position="bottom center"
                  content={<PrismCode code={q.query} language="sql" plugins={['line-numbers']} />}
                >
                  <Label size="mini" color={q.isValid ? 'green' : 'red'} content={idx} />
                </Tooltip>
              </List.Item>
            );
          })}
        </List>
      </Segment>
    );
  }
}
