import React from 'react';
import { observer, inject } from 'mobx-react';
import ViewStateStore from '../../../../stores/view_state_store';
import { computed } from 'mobx';
import _ from 'lodash';
import { Input, Label, Button, Checkbox } from 'semantic-ui-react';
import Tooltip from '../../../../shared/Tooltip';
import WordcloudGraph, { GraphType, MAX_FONT_SIZE } from '../../../../models/Graphs/WordcloudGraph';
import { Range } from 'rc-slider';

interface Props {
  id: string;
  header: string[];
}

interface InjectedProps extends Props {
  viewStateStore: ViewStateStore;
}

const DISABLED_STYLE = {
  background: 'grey',
  borderColor: 'grey'
};

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

  @computed
  get isSliderActive() {
    return this.graph.minFontSize > 0;
  }

  @computed
  get graph(): WordcloudGraph {
    if (this.viewState.graph?.type !== GraphType.WordCloud) {
      throw new Error('No linegraph configured');
    }

    return this.viewState.graph;
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
              <Label color={this.graph.focused === 'countColumn' ? 'blue' : undefined}>Counts</Label>
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
        <div className="range-slider">
          <Tooltip content="Minimal Fontsize">
            <Label
              as="a"
              id="min-font-size"
              size="mini"
              detail={`${this.graph.minFontSize}px`}
              active={this.isSliderActive}
            />
          </Tooltip>
          <Tooltip content="Maximal Fontsize">
            <Label
              as="a"
              id="max-font-size"
              size="mini"
              detail={`${this.graph.maxFontSize}px`}
              active={this.isSliderActive}
            />
          </Tooltip>
          <Range
            min={0}
            max={MAX_FONT_SIZE}
            className="font-size-slider"
            defaultValue={[this.graph.minFontSize, this.graph.maxFontSize]}
            value={[this.graph.minFontSize, this.graph.maxFontSize]}
            pushable={10}
            trackStyle={this.isSliderActive ? undefined : [DISABLED_STYLE]}
            handleStyle={this.isSliderActive ? undefined : [DISABLED_STYLE, DISABLED_STYLE]}
            onChange={(tabs) => {
              this.graph.minFontSize = tabs[0];
              if (tabs[0] > 0) {
                this.graph.maxFontSize = tabs[1];
              }
            }}
          />
        </div>
        <Checkbox
          toggle
          checked={this.graph.deterministic}
          label="Deterministic"
          onChange={() => (this.graph.deterministic = !this.graph.deterministic)}
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
