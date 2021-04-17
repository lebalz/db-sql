import React from 'react';
import { inject, observer } from 'mobx-react';
import { computed } from 'mobx';
import SqlQuery from '../../models/SqlQuery';
import ViewStateStore from '../../stores/view_state_store';
import { Message } from 'semantic-ui-react';

interface Props {
  sqlQuery: SqlQuery;
}

interface InjectedProps extends Props {
  viewStateStore: ViewStateStore;
}

@inject('viewStateStore')
@observer
export default class SqlQueryErrors extends React.Component<Props> {
  get injected() {
    return this.props as InjectedProps;
  }

  @computed
  get sqlQuery() {
    return this.props.sqlQuery;
  }

  render() {
    return (
      <div>
        {this.sqlQuery.errors.map((err) => {
          return (
            <Message error size="mini" key={err.query_idx}>
              <Message.Header>{`Error in the ${err.query_idx + 1}. query`}</Message.Header>
              <p>{err.error}</p>
            </Message>
          );
        })}
      </div>
    );
  }
}
