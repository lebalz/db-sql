import React, { Fragment } from 'react';
import { Button, Segment, Checkbox } from 'semantic-ui-react';
import { observer } from 'mobx-react';
import _ from 'lodash';
import SqlEditor from './SqlEditor';
import ResultIndex from '../ResultIndex';
import { default as QueryModel } from '../../../models/QueryEditor';
import { REST } from '../../../declarations/REST';
import Slider from '../../../shared/Slider';
import { ResultType } from '../../../models/Result';

interface Props {
  query: QueryModel;
}

const MIN_EDITOR_HEIGHT = 50;
const EDITOR_PADDING_TOP = 10;
const DEFAULT_EDITOR_HEIGHT = 200;

@observer
export default class QueryEditor extends React.Component<Props> {
  wrapperRef = React.createRef<HTMLElement>();

  state: { editorHeight: number } = {
    editorHeight: DEFAULT_EDITOR_HEIGHT
  };

  onResize = (topShare: number) => {
    this.setState({ editorHeight: topShare - this.wrapperTopY });
  };

  get wrapperTopY() {
    const wrapper = document.getElementById('editor-wrapper');
    if (!wrapper) {
      return 0;
    }
    return wrapper.getBoundingClientRect().y;
  }

  render() {
    return (
      <Fragment>
        <Segment
          id="editor-wrapper"
          attached="bottom"
          style={{ padding: `${EDITOR_PADDING_TOP}px 0 0 0`, marginBottom: '0' }}
        >
          <div style={{ display: 'flex', flexDirection: 'row' }}>
            <SqlEditor sql={this.props.query} height={this.state.editorHeight} />
          </div>
          <Slider
            hideIcon
            direction="vertical"
            shift={-EDITOR_PADDING_TOP}
            onChange={this.onResize}
            defaultSize={DEFAULT_EDITOR_HEIGHT}
            minSize={MIN_EDITOR_HEIGHT + this.wrapperTopY}
            iconPosition={{ right: '6em' }}
          />
        </Segment>
        <div className="query-bar">
          <Checkbox
            toggle
            checked={this.props.query.proceedAfterError}
            disabled={this.props.query.executionMode === ResultType.Raw}
            label="Proceed after sql error"
            onChange={() => this.props.query.toggleProceedAfterError()}
          />
          <Checkbox
            toggle
            checked={this.props.query.executionMode === ResultType.Raw}
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
        <ResultIndex query={this.props.query} />
      </Fragment>
    );
  }
}
