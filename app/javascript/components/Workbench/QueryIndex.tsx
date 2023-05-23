import { computed } from 'mobx';
import { inject, observer } from 'mobx-react';
import React from 'react';
import { Icon, Label, List, Segment } from 'semantic-ui-react';
import { SemanticCOLORS } from 'semantic-ui-react/dist/commonjs/generic';
import Database from '../../models/Database';
import SqlQuery from '../../models/SqlQuery';
import Tooltip from '../../shared/Tooltip';
import SqlQueryStore from '../../stores/sql_query_store';
import ViewStateStore from '../../stores/view_state_store';
import SqlQueryPreview from '../SqlQueries/SqlQueryPreview';
import { PrismCode } from './SqlResult/PrismCode';

interface Props {
  dbServerId: string;
  dbName: string;
}

interface InjectedProps extends Props {
  sqlQueryStore: SqlQueryStore;
  viewStateStore: ViewStateStore;
}

@inject('sqlQueryStore', 'viewStateStore')
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

  get queryScope() {
    return `${this.props.dbServerId}-${this.props.dbName}`;
  }

  @computed
  get activeQuery(): SqlQuery | undefined {
    const id =
      this.injected.viewStateStore.previewQueries.get(this.queryScope) ||
      this.injected.viewStateStore.previewSelectedQueries.get(this.queryScope)?.id;
    return this.injected.sqlQueryStore.find(id);
  }
  @computed
  get selectedQuery(): SqlQuery | undefined {
    const selected = this.injected.viewStateStore.previewSelectedQueries.get(this.queryScope);
    return this.injected.sqlQueryStore.find(selected?.id);
  }

  onClick = (element: EventTarget & HTMLElement, scope: string, id: string) => {
    this.injected.viewStateStore.toggleSelectedQuery(scope, id, element);
  };

  render() {
    if (this.queries.length === 0) {
      return null;
    }
    return (
      <Segment attached>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ width: 'max-content' }}>
            <div style={{ display: 'flex', flexDirection: 'row' }}>
              {this.queries.map((q, idx) => {
                let color: SemanticCOLORS = q.isValid ? 'green' : 'red';
                if (this.activeQuery?.id && this.selectedQuery?.id === q.id) {
                  color = 'teal';
                }
                return (
                  <Label
                    basic={!(this.activeQuery?.id === q.id || this.selectedQuery?.id === q.id)}
                    style={{ cursor: 'pointer' }}
                    size="mini"
                    color={color}
                    onClick={(event) => this.onClick(event.currentTarget, q.scope, q.id)}
                    // onMouseOver={() => this.injected.viewStateStore.setPreviewQuery(q.scope, q.id)}
                    // onMouseLeave={() => this.injected.viewStateStore.unsetPreviewQuery(q.scope, q.id)}
                    key={idx}
                  >
                    {q.isFavorite && <Icon name="star" color="yellow" />}
                    {idx}
                  </Label>
                );
              })}
              <span style={{ width: '2em' }}></span>
            </div>
          </div>
        </div>
        {this.activeQuery && (
          <SqlQueryPreview sqlQuery={this.activeQuery} index={this.queries.indexOf(this.activeQuery)} />
        )}
      </Segment>
    );
  }
}
