import React, { Fragment } from 'react';
import { Segment, Label, Popup, Header, Accordion } from 'semantic-ui-react';
import _ from 'lodash';
import { ResultType } from '../../api/db_server';
import { computed } from 'mobx';
import { SqlResult } from './SqlResult/SqlResult';
import Query, { QueryType, TableData } from '../../models/Query';
import { SemanticCOLORS } from 'semantic-ui-react/dist/commonjs/generic';

interface Props {
  query: Query;
}

const labelColor = (result: TableData): SemanticCOLORS => {
  switch (result.type) {
    case ResultType.Error:
      return 'red';
    case ResultType.Skipped:
      return 'yellow';
    case ResultType.Success:
      return 'green';
  }
};

export default class SqlResults extends React.Component<Props> {
  @computed
  get results() {
    return this.props.query.resultTableData;
  }

  @computed
  get errors() {
    return this.results.filter((r) => r.type === ResultType.Error);
  }

  @computed
  get succeeded() {
    return this.results.filter((r) => r.type === ResultType.Success);
  }

  get resultPanels() {
    return this.props.query.resultTableData.map((result, idx) => ({
      key: idx,
      title: {
        content: (
          <Fragment>
            <Label
              size="large"
              color={labelColor(result)}
              content={`Query #${idx + 1}`}
              style={{ marginRight: '1em', color: 'black' }}
            />
            {<TimeLabel result={result} />}
          </Fragment>
        )
      },
      content: {
        content: <SqlResult result={result} queryIndex={idx} key={idx} />
      }
    }));
  }

  render() {
    if (this.results.length === 0) {
      return null;
    }

    const totalTime = this.props.query.queryExecutionTime;

    return (
      <Fragment>
        <Header as="h5" attached="top" className="results-header">
          Result
          <Popup content={`${totalTime}s`} trigger={<Label color="blue">{totalTime.toFixed(2)}s</Label>} />
          {this.errors.length > 0 ? (
            <Popup
              content={`Errors: ${this.errors.length}`}
              trigger={
                <Label color="orange">{`${this.succeeded.length}/${this.results.length} successful`}</Label>
              }
            />
          ) : (
            <Popup
              content={'Executed all queries successfully'}
              trigger={<Label color="green">{`Queries: ${this.results.length}`}</Label>}
            />
          )}
        </Header>
        <Segment attached style={{ padding: 0 }}>
          <Accordion
            styled
            fluid
            exclusive={false}
            panels={this.resultPanels}
            className="sql-results"
            defaultActiveIndex={this.results.map((_, idx) => idx)}
          />
        </Segment>
      </Fragment>
    );
  }
}

export const TimeLabel = ({ result }: { result: TableData }) => {
  const { time } = result;
  if (time === undefined) {
    return null;
  }

  let popup: string;
  let label: string;
  switch (result.type) {
    case ResultType.Error:
      popup = `Time: ${time}s`;
      label = `${time.toFixed(2)}s`;
      break;
    case ResultType.Success:
      popup = `Time: ${time}s`;
      label = `${result.result.length} in ${time.toFixed(2)}s`;
      break;
    case ResultType.Skipped:
      popup = `Time: ${time}s`;
      label = `${time.toFixed(2)}s`;
      break;
  }
  return <Popup content={popup} trigger={<Label as="a" tag color="blue" content={label} />} />;
};
