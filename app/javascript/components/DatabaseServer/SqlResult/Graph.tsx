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

  render() {
    return (
      <Segment placeholder={this.viewState.graph === undefined}>
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
