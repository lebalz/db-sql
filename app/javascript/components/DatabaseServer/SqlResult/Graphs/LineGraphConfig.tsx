import React from 'react';
import { observer, inject } from 'mobx-react';
import ViewStateStore from '../../../../stores/view_state_store';
import { computed } from 'mobx';
import _ from 'lodash';
import { Input,  Label, Button } from 'semantic-ui-react';
import Tooltip from '../../../../shared/Tooltip';
import { GraphType } from '../../../../models/Graphs/WordcloudGraph';
import LineGraph from '../../../../models/Graphs/LineGraph';

interface Props {
  id: string;
  header: string[];
}

interface InjectedProps extends Props {
  viewStateStore: ViewStateStore;
}

@inject('viewStateStore')
@observer
class LineGraphConfig extends React.Component<Props> {
  @computed
  get injected() {
    return this.props as InjectedProps;
  }

  @computed
  get viewState() {
    return this.injected.viewStateStore.resultTableState(this.props.id);
  }

  @computed
  get graph(): LineGraph {
    if (this.viewState.graph?.type !== GraphType.LineGraph) {
      throw new Error('No linegraph configured');
    }

    return this.viewState.graph;
  }

  render() {
    if (this.viewState.graph?.type !== GraphType.LineGraph) {
      return null;
    }

    return (
      <div className="line-graph-config">
        <div className="y-columns">
          {this.graph.yColumns.map((idx, nr) => {
            const isFocused = this.graph.focused === 'yColumns' && this.graph.focuseIndex === nr;
            return (
              <Input
                key={nr}
                size="mini"
                label={
                  <Tooltip content="Select a data column containing y values">
                    <Label color={isFocused ? 'blue' : undefined} content={`y-column ${nr + 1}`} />
                  </Tooltip>
                }
                labelPosition="left"
                className="y-column"
                placeholder="y-Column"
                autoFocus
                value={this.props.header[idx] ?? ''}
                focus={isFocused}
                onFocus={() => {
                  if (this.viewState.graph) {
                    this.graph.focused = 'yColumns';
                    this.graph.focuseIndex = nr;
                  }
                }}
                icon={{
                  name: 'close',
                  circular: true,
                  link: true,
                  onClick: () => {
                    this.graph.colors.delete(nr);
                    this.graph.yColumns.remove(this.graph.yColumns[nr]);
                  }
                }}
              />
            );
          })}
          <Input
            size="mini"
            label={
              <Tooltip content="Select a data column containing y values">
                <Label
                  color={
                    this.graph.focused === 'yColumns' && this.graph.focuseIndex === this.graph.yColumns.length
                      ? 'blue'
                      : undefined
                  }
                  content={`y-column ${this.graph.yColumns.length + 1}`}
                />
              </Tooltip>
            }
            labelPosition="left"
            className="y-column"
            placeholder="y-Column"
            autoFocus
            value=""
            focus={this.graph.focused === 'yColumns' && this.graph.focuseIndex === this.graph.yColumns.length}
            onFocus={() => {
              if (this.viewState.graph) {
                this.graph.focused = 'yColumns';
                this.graph.focuseIndex = this.graph.yColumns.length;
              }
            }}
          />
        </div>
        <Input
          size="mini"
          label={
            <Tooltip
              content={
                <div>
                  <b>Optional</b>
                  <br />
                  Select a column containing the x values.
                  <br />
                  By default an ascending series starting at 0 is used.
                </div>
              }
            >
              <Label color={this.graph.focused === 'xColumn' ? 'blue' : undefined}>x-column</Label>
            </Tooltip>
          }
          disabled={this.graph.selectedColumns.length === 0}
          labelPosition="left"
          className="x-column"
          placeholder="x-Column"
          value={this.graph.xColumn !== undefined ? this.props.header[this.graph.xColumn] : ''}
          focus={this.graph.focused === 'xColumn'}
          onFocus={() => {
            if (this.viewState.graph) {
              this.graph.focused = 'xColumn';
              this.graph.focuseIndex = 0;
            }
          }}
          icon={{
            name: 'close',
            circular: true,
            link: true,
            onClick: () => (this.graph.xColumn = undefined)
          }}
        />
        <div className="spacer" />
        <Tooltip content="Close Graph">
          <Button size="mini" icon="close" onClick={() => (this.viewState.graph = undefined)} />
        </Tooltip>
      </div>
    );
  }
}

export default LineGraphConfig;
