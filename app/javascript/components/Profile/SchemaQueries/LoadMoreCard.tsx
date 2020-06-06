import React from 'react';
import { Card, Icon } from 'semantic-ui-react';
import { inject, observer } from 'mobx-react';
import SchemaQueryStore from '../../../stores/schema_query_store';
import { computed } from 'mobx';
import { REST } from '../../../declarations/REST';

interface Props {}

interface InjectedProps extends Props {
  schemaQueryStore: SchemaQueryStore;
}

@inject('schemaQueryStore')
@observer
export default class LoadMoreCard extends React.Component<Props> {
  get injected() {
    return this.props as InjectedProps;
  }

  @computed
  get dbType() {
    return this.injected.schemaQueryStore.selectedDbType;
  }

  render() {
    const schemaQueryState = this.injected.schemaQueryStore.fetchRequestState[this.dbType];
    const isLoading = schemaQueryState.state === REST.Requested;
    return (
      <Card
        onClick={() => this.injected.schemaQueryStore.loadNextBatch(this.dbType)}
        className="schema-query-card"
      >
        <Card.Content>
          <Card.Header textAlign="center">
            <Icon name={isLoading ? 'circle notch' : 'plus'} circular loading={isLoading} />
          </Card.Header>
          <Card.Description>Load more Queries</Card.Description>
        </Card.Content>
      </Card>
    );
  }
}
