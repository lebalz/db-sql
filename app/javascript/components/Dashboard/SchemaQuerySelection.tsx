import React from 'react';
import { Label } from 'semantic-ui-react';
import { inject, observer } from 'mobx-react';
import { TempDbServer } from '../../models/TempDbServer';
import SchemaQueryStore from '../../stores/schema_query_store';
import { computed } from 'mobx';
import SqlEditor from '../DatabaseServer/Query/SqlEditor';
import SchemaQuery from '../../models/SchemaQuery';
import SchemaQueryCard from '../Profile/SchemaQueries/SchemaQueryCard';
import LoadMoreCard from '../Profile/SchemaQueries/LoadMoreCard';

interface Props {
  dbServer: TempDbServer;
}

interface InjectedProps extends Props {
  schemaQueryStore: SchemaQueryStore;
}

@inject('schemaQueryStore')
@observer
export default class SchemaQuerySelection extends React.Component<Props> {
  get injected() {
    return this.props as InjectedProps;
  }

  @computed
  get dbServer() {
    return this.props.dbServer;
  }

  @computed
  get selectedSchemaQuery(): SchemaQuery | undefined {
    return this.injected.schemaQueryStore.find(this.dbServer.databaseSchemaQueryId);
  }

  render() {
    const schemaQueryState = this.injected.schemaQueryStore.fetchRequestState[this.dbServer.dbType];
    const canLoadMore = schemaQueryState.available !== schemaQueryState.loaded;
    return (
      <div className="schema-query">
        <div className="selection">
          <Label as="a" color="teal" ribbon content="Database Schema Query" style={{ left: '-1.1em' }} />
          <div className="history" style={{ height: '250px' }}>
            <div className="cards-container">
              {this.injected.schemaQueryStore.schemaQueries.map((rev) => (
                <SchemaQueryCard
                  key={rev.id}
                  schemaQuery={rev}
                  isActive={this.dbServer.databaseSchemaQueryId === rev.id}
                  onSelect={() => (this.dbServer.databaseSchemaQueryId = rev.id)}
                />
              ))}
              {canLoadMore && <LoadMoreCard />}
            </div>
          </div>
        </div>
        {this.selectedSchemaQuery && (
          <SqlEditor className="editor" readOnly={true} sql={this.selectedSchemaQuery} height={250} />
        )}
      </div>
    );
  }
}
