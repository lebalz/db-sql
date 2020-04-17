import React from 'react';
import { observer, inject } from 'mobx-react';
import ViewStateStore from '../../../../stores/view_state_store';
import { computed, action } from 'mobx';
import _ from 'lodash';
import { Input, InputOnChangeData } from 'semantic-ui-react';
import { GraphType } from '../../../../models/Graph';

interface Props {
  id: string;
  header: string[];
}

interface InjectedProps extends Props {
  viewStateStore: ViewStateStore;
}

@inject('viewStateStore')
@observer
class WordCloudConfig extends React.Component<Props> {
  @computed
  get injected() {
    return this.props as InjectedProps;
  }

  @computed
  get viewState() {
    return this.injected.viewStateStore.resultTableState(this.props.id);
  }

  @computed
  get wordColumnName(): string {
    if (this.viewState.graph?.wordColumn === undefined) {
      return '';
    }
    return this.props.header[this.viewState.graph.wordColumn];
  }

  @computed
  get countColumnName(): string {
    if (this.viewState.graph?.countColumn === undefined) {
      return '';
    }
    return this.props.header[this.viewState.graph.countColumn];
  }

  @action
  onChangeMinFontSize(data: InputOnChangeData) {
    if (!this.viewState.graph) {
      return;
    }
    const fontSize = Number.parseInt(data.value, 10);
    if (fontSize < 0) {
      return (this.viewState.graph.minFontSize = 0);
    }
    if (fontSize > this.viewState.graph.maxFontSize) {
      this.viewState.graph.maxFontSize = fontSize + 1;
    }
    this.viewState.graph.minFontSize = fontSize;
  }

  @action
  onChangeMaxFontSize(data: InputOnChangeData) {
    if (!this.viewState.graph) {
      return;
    }
    const fontSize = Number.parseInt(data.value, 10);
    if (fontSize < 0) {
      return (this.viewState.graph.maxFontSize = 0);
    }
    if (fontSize < this.viewState.graph.minFontSize) {
      this.viewState.graph.maxFontSize = this.viewState.graph.minFontSize + 1;
    }
    this.viewState.graph.maxFontSize = fontSize;
  }

  render() {
    if (this.viewState.graph?.type !== GraphType.WordCloud) {
      return null;
    }

    return (
      <div className="wordcloud-config">
        <Input
          size="mini"
          label={{ content: 'Words' }}
          labelPosition="left"
          className="word-column"
          placeholder="Word Column"
          autoFocus
          value={this.wordColumnName}
          focus={this.viewState.graph.focused === 'wordColumn'}
          onFocus={() => {
            if (this.viewState.graph) {
              this.viewState.graph.focused = 'wordColumn';
            }
          }}
        />
        <Input
          size="mini"
          label={{ content: 'Counts' }}
          labelPosition="left"
          className="count-column"
          placeholder="Count Column"
          value={this.countColumnName}
          focus={this.viewState.graph.focused === 'countColumn'}
          onFocus={() => {
            if (this.viewState.graph) {
              this.viewState.graph.focused = 'countColumn';
            }
          }}
        />
        <Input
          className="numeric"
          size="mini"
          label={{ content: 'Min' }}
          title="Minimal Fontsize"
          labelPosition="left"
          type="number"
          value={this.viewState.graph.minFontSize <= 0 ? undefined : this.viewState.graph.minFontSize}
          onChange={(_, data) => this.onChangeMinFontSize(data)}
        />
        <Input
          className="numeric"
          size="mini"
          label={{ content: 'Max' }}
          title="Maximal Fontsize"
          labelPosition="left"
          type="number"
          disabled={this.viewState.graph.minFontSize <= 0}
          value={this.viewState.graph.maxFontSize}
          onChange={(_, data) => this.onChangeMaxFontSize(data)}
        />
      </div>
    );
  }
}

export default WordCloudConfig;
