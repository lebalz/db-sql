import React, { Fragment } from 'react';
import ReactWordcloud, { Word, Options, Optional } from 'react-wordcloud';
import { observer, inject } from 'mobx-react';
import ViewStateStore from '../../../../stores/view_state_store';
import { computed } from 'mobx';
import { SuccessTableData } from '../../../../models/Query';
import _ from 'lodash';
import WordCloudConfig from './WordCloudConfig';
import WordcloudGraph, { GraphType } from '../../../../models/Graphs/WordcloudGraph';

interface Props {
  id: string;
  data: SuccessTableData;
}

interface InjectedProps extends Props {
  viewStateStore: ViewStateStore;
}

@inject('viewStateStore')
@observer
class WordCloud extends React.Component<Props> {
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
    if (this.viewState.graph?.type !== GraphType.WordCloud) {
      return [];
    }
    const { data } = this.props;
    const wordIndex = this.viewState.graph.wordColumn;
    if (wordIndex === undefined) {
      return [];
    }
    const countIndex = this.viewState.graph.countColumn;
    const wordKey = this.headers[wordIndex];
    if (countIndex === undefined) {
      const groups = _.groupBy(data.result.map((r) => r[wordKey]));
      return Object.keys(groups).map((k) => ({ text: k, value: groups[k].length }));
    }

    const countKey = this.headers[countIndex];
    return data.result.map((r) => ({ text: r[wordKey] as string, value: r[countKey] as number }));
  }

  @computed
  get headers() {
    return Object.keys(this.props.data.result[0]);
  }

  @computed
  get graph(): WordcloudGraph {
    if (this.viewState.graph?.type !== GraphType.WordCloud) {
      throw new Error('No linegraph configured');
    }

    return this.viewState.graph;
  }

  @computed
  get wordcloudOptions(): Optional<Options> | undefined {
    if (!this.viewState.graph) {
      return;
    }
    const minFontSize = this.graph.minFontSize;
    const maxFontSize = this.graph.maxFontSize;
    if (minFontSize < 1 || maxFontSize < 1) {
      return;
    }
    return {
      fontSizes: [minFontSize, maxFontSize]
    };
  }

  render() {
    return (
      <Fragment>
        <WordCloudConfig header={this.headers} id={this.props.id} />
        {this.wordClouds.length > 0 && (
          <ReactWordcloud words={this.wordClouds} options={this.wordcloudOptions} />
        )}
      </Fragment>
    );
  }
}

export default WordCloud;
