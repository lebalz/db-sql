import React, { Fragment } from 'react';
import { Word } from 'react-wordcloud';
import { observer, inject } from 'mobx-react';
import ViewStateStore from '../../../stores/view_state_store';
import { computed } from 'mobx';
import { SuccessTableData } from '../../../models/Query';
import { ResultType } from '../../../api/db_server';
import _ from 'lodash';
import { Segment, Header, Icon, Button } from 'semantic-ui-react';
import { WordcloudGraph, GraphType } from '../../../models/Graph';
import WordCloud from './Graphs/WordCloud';

interface Props {
  id: string;
  data: SuccessTableData;
}

interface InjectedProps extends Props {
  viewStateStore: ViewStateStore;
}

@inject('viewStateStore')
@observer
class Graph extends React.Component<Props> {
  @computed
  get injected() {
    return this.props as InjectedProps;
  }

  @computed
  get viewState() {
    return this.injected.viewStateStore.resultTableState(this.props.id);
  }

  @computed
  get wordClouds(): Word[] {
    const cols = this.viewState.graph?.selectedColumns;
    if (!cols || cols.length > 2 || cols.length === 0) {
      return [];
    }
    const { data } = this.props;
    if (!data || data.type !== ResultType.Success) {
      return [];
    }
    const columnNames = Object.keys(data.result[0]);
    if (cols.length === 1) {
      const colName = columnNames[cols[0]];
      const groups = _.groupBy(data.result.map((r) => r[colName]));
      return Object.keys(groups).map((k) => ({ text: k, value: groups[k].length }));
    }

    const valueKey = columnNames[cols[0]];
    const countKey = columnNames[cols[1]];
    return data.result.map((r) => ({ text: r[valueKey] as string, value: r[countKey] as number }));
  }

  render() {
    return (
      <Segment>
        {this.viewState.graph === undefined && (
          <Fragment>
            <Header icon>
              <Icon name="area graph" />
              Create a Graph
            </Header>
            <Segment.Inline>
              <Button
                icon="cloud"
                content="Wordcloud"
                onClick={() => (this.viewState.graph = new WordcloudGraph())}
              />
              <Button
                icon="area graph"
                content="Line Graph"
              />
            </Segment.Inline>
          </Fragment>
        )}
        {this.viewState.graph?.type === GraphType.WordCloud && (
          <Fragment>
            <WordCloud data={this.props.data} id={this.props.id} />
          </Fragment>
        )}
      </Segment>
    );
  }
}

export default Graph;
