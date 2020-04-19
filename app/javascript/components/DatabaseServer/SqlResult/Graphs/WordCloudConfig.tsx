import React from 'react';
import { observer, inject } from 'mobx-react';
import ViewStateStore from '../../../../stores/view_state_store';
import { computed, action } from 'mobx';
import _ from 'lodash';
import { Input, InputOnChangeData, Label, Button } from 'semantic-ui-react';
import Tooltip from '../../../../shared/Tooltip';
import WordcloudGraph, { GraphType } from '../../../../models/Graphs/WordcloudGraph';

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
    if (this.graph?.wordColumn === undefined) {
      return '';
    }
    return this.props.header[this.graph.wordColumn];
  }

  @computed
  get countColumnName(): string {
    if (this.graph.countColumn === undefined) {
      return '';
    }
    return this.props.header[this.graph.countColumn];
  }

  @action
  onChangeMinFontSize(data: InputOnChangeData) {
    if (!this.viewState.graph) {
      return;
    }
    const fontSize = Number.parseInt(data.value, 10);
    if (fontSize < 0) {
      return (this.graph.minFontSize = 0);
    }
    if (fontSize > this.graph.maxFontSize) {
      this.graph.maxFontSize = fontSize + 1;
    }
    this.graph.minFontSize = fontSize;
  }

  @computed
  get graph(): WordcloudGraph {
    if (this.viewState.graph?.type !== GraphType.WordCloud) {
      throw new Error('No linegraph configured');
    }

    return this.viewState.graph;
  }

  @action
  onChangeMaxFontSize(data: InputOnChangeData) {
    if (!this.viewState.graph) {
      return;
    }
    const fontSize = Number.parseInt(data.value, 10);
    if (fontSize < 0) {
      return (this.graph.maxFontSize = 0);
    }
    if (fontSize < this.graph.minFontSize) {
      this.graph.maxFontSize = this.graph.minFontSize + 1;
    }
    this.graph.maxFontSize = fontSize;
  }

  render() {
    if (this.graph?.type !== GraphType.WordCloud) {
      return null;
    }

    const wordColumnSet = this.graph.wordColumn !== undefined;

    return (
      <div className="wordcloud-config">
        <Input
          size="mini"
          label={
            <Tooltip content="Select a column containing the words">
              <Label color={this.graph.focused === 'wordColumn' ? 'blue' : undefined}>Words</Label>
            </Tooltip>
          }
          labelPosition="left"
          className="word-column"
          placeholder="Word Column"
          autoFocus
          value={this.wordColumnName}
          focus={this.graph.focused === 'wordColumn'}
          onFocus={() => {
            if (this.viewState.graph) {
              this.viewState.graph.focused = 'wordColumn';
            }
          }}
        />
        <Input
          size="mini"
          label={
            <Tooltip
              content={
                <div>
                  <b>Optional</b>
                  <br />
                  Select a column containing the word counts.
                  <br />
                  Can be used in combination with GROUP BY clauses.
                </div>
              }
            >
              <Label color={this.graph.focused === 'countColumn' ? 'blue' : undefined}>
                Counts
              </Label>
            </Tooltip>
          }
          disabled={!wordColumnSet}
          labelPosition="left"
          className="count-column"
          placeholder="Count Column"
          value={this.countColumnName}
          focus={this.graph.focused === 'countColumn'}
          onFocus={() => {
            if (this.viewState.graph) {
              this.viewState.graph.focused = 'countColumn';
            }
          }}
        />
        <Input
          className="numeric"
          size="mini"
          label={
            <Tooltip content="The minimal fontsize used for the words">
              <Label content="Min" />
            </Tooltip>
          }
          disabled={!wordColumnSet}
          title="Minimal Fontsize"
          labelPosition="left"
          type="number"
          value={this.graph.minFontSize <= 0 ? undefined : this.graph.minFontSize}
          onChange={(_, data) => this.onChangeMinFontSize(data)}
        />
        <Input
          className="numeric"
          size="mini"
          label={
            <Tooltip content="The maximal fontsize used for the words">
              <Label content="Max" />
            </Tooltip>
          }
          title="Maximal Fontsize"
          labelPosition="left"
          type="number"
          disabled={!wordColumnSet || this.graph.minFontSize <= 0}
          value={this.graph.maxFontSize}
          onChange={(_, data) => this.onChangeMaxFontSize(data)}
        />
        <div className="spacer" />
        <Tooltip content="Close Graph">
          <Button size="mini" icon="close" onClick={() => (this.viewState.graph = undefined)} />
        </Tooltip>
      </div>
    );
  }
}

export default WordCloudConfig;
