import React, { Fragment } from 'react';
import ReactWordcloud, { Word, Options, Optional } from 'react-wordcloud';
import { observer, inject } from 'mobx-react';
import ViewStateStore from '../../../../stores/view_state_store';
import { computed } from 'mobx';
import { SuccessTableData } from '../../../../models/Query';
import _ from 'lodash';
import WordCloudConfig from './WordCloudConfig';
import WordcloudGraph, { GraphType } from '../../../../models/Graphs/WordcloudGraph';
import Slider from '../../../../shared/Slider';

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
  wordcloudRef = React.createRef<HTMLDivElement>();
  state = {
    height: 300
  };

  @computed
  get injected() {
    return this.props as InjectedProps;
  }

  @computed
  get viewState() {
    return this.injected.viewStateStore.resultTableState(this.props.id);
  }

  get wordcloudTopShare() {
    if (!this.wordcloudRef.current) {
      return 0;
    }
    return this.wordcloudRef.current.getBoundingClientRect().top;
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

    if (this.graph.minFontSize < 1) {
      return {
        deterministic: this.graph.deterministic
      };
    }
    return {
      fontSizes: [this.graph.minFontSize, this.graph.maxFontSize],
      deterministic: this.graph.deterministic
    };
  }

  render() {
    return (
      <Fragment>
        <WordCloudConfig header={this.headers} id={this.props.id} hasChart={this.wordClouds.length > 0} />
        {this.wordClouds.length > 0 && (
          <Fragment>
            <div
              id={`WordCloud-${this.props.id}`}
              ref={this.wordcloudRef}
              style={{ height: `${this.state.height}px` }}
            >
              <ReactWordcloud words={this.wordClouds} options={this.wordcloudOptions} />
            </div>
            <Slider
              direction="vertical"
              onChange={(topShare) => {
                this.setState({ height: topShare - this.wordcloudTopShare });
              }}
              defaultSize={300}
              minSize={this.wordcloudTopShare + 100}
            />
          </Fragment>
        )}
      </Fragment>
    );
  }
}

export default WordCloud;
