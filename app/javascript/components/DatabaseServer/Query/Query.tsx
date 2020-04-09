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

@observer
export default class Query extends React.Component<Props> {
  render() {
    return (
      <Fragment>
        <Segment attached="bottom" style={{ padding: '0.5em 0 0 0', marginBottom: '0' }}>
          <SqlEditor query={this.props.query} />
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
