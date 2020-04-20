import React, { Fragment } from 'react';
import { Button, Segment, Checkbox } from 'semantic-ui-react';
import { observer } from 'mobx-react';
import _ from 'lodash';
import SqlEditor from './SqlEditor';
import SqlResults from '../SqlResults';
import { default as QueryModel, QueryExecutionMode } from '../../../models/Query';
import { REST } from '../../../declarations/REST';

interface Props {
  query: QueryModel;
}

const MIN_EDITOR_HEIGHT = 50;
const EDITOR_PADDING_TOP = 10;
const DEFAULT_EDITOR_HEIGHT = 280;

@observer
export default class Query extends React.Component<Props> {
  state: { mouseDown: boolean; editorHeight: number } = {
    mouseDown: false,
    editorHeight: DEFAULT_EDITOR_HEIGHT
  };

  componentDidMount() {
    document.addEventListener('mouseup', this.onMouseUp);
    document.addEventListener('mousemove', this.onMouseMove);
  }

  componentWillUnmount() {
    document.removeEventListener('mouseup', this.onMouseUp);
    document.removeEventListener('mousemove', this.onMouseMove);
  }

  onMouseDown = () => {
    this.setState({ mouseDown: true });
  };

  onMouseUp = () => {
    this.setState({ mouseDown: false });
  };

  onMouseMove = (e: MouseEvent) => {
    if (this.state.mouseDown) {

      e.preventDefault();
      e.stopPropagation();

      const wrapper = document.getElementById('editor-wrapper');

      if (!wrapper) {
        return console.log('Resizing not possible due to missing dom elements');
      }
      const topY = wrapper.getBoundingClientRect().y;

      const height = Math.max(Math.max(0, e.clientY - topY - EDITOR_PADDING_TOP), MIN_EDITOR_HEIGHT);

      this.setState({ editorHeight: height });
    }
  };

  render() {
    return (
      <Fragment>
        <Segment id="editor-wrapper" attached="bottom" style={{ padding: `${EDITOR_PADDING_TOP}px 0 0 0`, marginBottom: '0' }}>
          <SqlEditor query={this.props.query} height={this.state.editorHeight} />
          <div id="ace-resizer" onMouseDown={this.onMouseDown} />
        </Segment>
        <div className="query-bar">
          <Checkbox
            toggle
            checked={this.props.query.proceedAfterError}
            disabled={this.props.query.executionMode === QueryExecutionMode.Raw}
            label="Proceed after sql error"
            onChange={() => this.props.query.toggleProceedAfterError()}
          />
          <Checkbox
            toggle
            checked={this.props.query.executionMode === QueryExecutionMode.Raw}
            label="Execute raw query"
            onChange={() => this.props.query.toggleExecuteRawQuery()}
          />
          <div className="spacer" />
          <Button
            positive
            style={{ marginRight: 0 }}
            disabled={this.props.query.requestState === REST.Requested}
            loading={this.props.query.requestState === REST.Requested}
            onClick={() => this.props.query.run()}
          >
            Query
          </Button>
        </div>
        <SqlResults query={this.props.query} />
      </Fragment>
    );
  }
}
