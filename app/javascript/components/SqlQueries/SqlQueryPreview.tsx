import React from 'react';
import { Label, Segment } from 'semantic-ui-react';
import { inject, observer } from 'mobx-react';
import { computed } from 'mobx';
import SqlQuery from '../../models/SqlQuery';
import { PrismCode } from '../Workbench/SqlResult/PrismCode';
import ViewStateStore from '../../stores/view_state_store';
import SqlQueryActions from './SqlQueryActions';
import SqlQueryErrors from './SqlQueryErrors';
import SqlQueryLabels, { QueryLabels } from './SqlQueryLabels';

interface Props {
  sqlQuery: SqlQuery;
  index: number;
}

interface InjectedProps extends Props {
  viewStateStore: ViewStateStore;
}

@inject('viewStateStore')
@observer
export default class SqlQueryPreview extends React.Component<Props> {
  get injected() {
    return this.props as InjectedProps;
  }

  @computed
  get sqlQuery() {
    return this.props.sqlQuery;
  }
  @computed
  get viewState() {
    return this.injected.viewStateStore;
  }
  render() {
    const { scope, id } = this.sqlQuery;
    return (
      <Segment
        raised={this.viewState.sqlQueryPreviewHovered}
        onMouseOver={() => {
          this.viewState.setSqlQueryPreviewHovered(true);
          this.viewState.cancelPreviewTimeout(scope, id);
        }}
        onMouseLeave={() => {
          this.viewState.setSqlQueryPreviewHovered(false);
          this.viewState.unsetPreviewQuery(scope, id);
        }}
      >
        <div key={id}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <SqlQueryActions
              sqlQuery={this.sqlQuery}
              onPlay={() => this.sqlQuery.insertInEditor()}
              playTooltip="Insert in the editor"
            />
            <SqlQueryLabels
              sqlQuery={this.sqlQuery}
              exclude={[QueryLabels.DbType, QueryLabels.OwnerType]}
              additional={
                <Label
                  style={{ verticalAlign: 'text-bottom' }}
                  content={`#${this.props.index}`}
                  color={
                    this.viewState.previewSelectedQueries.get(scope)?.id === this.sqlQuery.id
                      ? 'teal'
                      : undefined
                  }
                  size="mini"
                />
              }
            />
            <div style={{ color: 'gray', marginBottom: '0.4em', fontStyle: 'italic' }}>
              {this.sqlQuery.createdAt.toLocaleString()}
            </div>
          </div>
          <PrismCode
            code={this.sqlQuery.preview}
            language="sql"
            plugins={['line-numbers']}
            style={{ maxHeight: '22em', fontSize: 'smaller' }}
            trim
          />
          <SqlQueryErrors sqlQuery={this.sqlQuery} />
        </div>
      </Segment>
    );
  }
}
