import React, { Fragment } from 'react';
import { observer, inject } from 'mobx-react';
import ViewStateStore from '../../../../stores/view_state_store';
import { computed } from 'mobx';
import { SuccessTableData } from '../../../../models/Query';
import _ from 'lodash';
import LineGraphConfig from './LineGraphConfig';
import { LineChart, Line, XAxis, Legend, YAxis, Tooltip } from 'recharts';
import { GraphType } from '../../../../models/Graphs/WordcloudGraph';
import { default as LineGraphModel } from '../../../../models/Graphs/LineGraph';
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
class LineGraph extends React.Component<Props> {
  chartWrapper = React.createRef<HTMLDivElement>();
  chartRef = React.createRef<HTMLDivElement>();
  state = {
    width: 600,
    height: 300
  };

  componentDidMount() {
    if (!this.chartWrapper.current) {
      return;
    }
    window.addEventListener('resize', this.onResize);
    this.setState({ width: this.width });
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.onResize);
  }

  onResize = (event: UIEvent) => {
    this.setState({ width: this.width });
  };

  @computed
  get injected() {
    return this.props as InjectedProps;
  }

  get chartTopShare() {
    if (!this.chartRef.current) {
      return 0;
    }
    return this.chartRef.current.getBoundingClientRect().top;
  }

  @computed
  get viewState() {
    return this.injected.viewStateStore.resultTableState(this.props.id);
  }

  @computed
  get graph(): LineGraphModel {
    if (this.viewState.graph?.type !== GraphType.LineGraph) {
      throw new Error('No linegraph configured');
    }

    return this.viewState.graph;
  }

  @computed
  get width(): number {
    if (!this.chartWrapper.current) {
      return 600;
    }
    return this.chartWrapper.current.clientWidth;
  }

  @computed
  get headers() {
    return Object.keys(this.props.data.result[0]);
  }

  render() {
    return (
      <div ref={this.chartWrapper} style={{ width: '100%' }}>
        <LineGraphConfig header={this.headers} id={this.props.id} hasChart={this.graph.yColumns.length > 0} />
        {this.graph.yColumns.length > 0 && (
          <div id={`LineGraph-${this.props.id}`} ref={this.chartRef}>
            <LineChart
              width={this.state.width}
              height={this.state.height}
              data={this.props.data.result}
              margin={{ top: 20, right: 5, left: 0, bottom: 5 }}
            >
              <XAxis
                dataKey={this.graph.xColumn !== undefined ? this.headers[this.graph.xColumn] : undefined}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              {this.graph.yColumns.map((idx) => {
                return (
                  <Line
                    type="monotone"
                    dataKey={this.headers[idx]}
                    key={idx}
                    dot={false}
                    stroke={this.graph.colors.get(idx)}
                  />
                );
              })}
            </LineChart>
          </div>
        )}
        <Slider
          direction="vertical"
          onChange={(topShare) => {
            this.setState({ height: topShare - this.chartTopShare });
          }}
          defaultSize={300}
          minSize={this.chartTopShare + 100}
        />
      </div>
    );
  }
}

export default LineGraph;
