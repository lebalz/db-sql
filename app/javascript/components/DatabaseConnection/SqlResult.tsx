import React, { Fragment } from 'react';
import { inject, observer } from 'mobx-react';
import DbConnectionStore from '../../stores/db_connection_store';
import {
  Segment,
  Table,
  Message,
  Label,
  Popup,
  Header
} from 'semantic-ui-react';
import _ from 'lodash';

interface InjectedProps {
  dbConnectionStore: DbConnectionStore;
}

@inject('dbConnectionStore')
@observer
export default class SqlResult extends React.Component {
  get injected() {
    return this.props as InjectedProps;
  }

  render() {
    const results = this.injected.dbConnectionStore?.activeConnection?.activeDatabase
      ?.results;

    if (!results) {
      return null;
    }

    return (
      <Fragment>
        <Header as="h5" attached="top">
          Result
          <Popup
            content={`${_.sumBy(results, 'time')}s`}
            trigger={<Label color="blue">{_.sumBy(results, 'time').toFixed(2)}s</Label>}
          />
          {results.filter((r) => !!r.error).length > 0 ? (
            <Popup
              content={`Errors: ${results.filter((r) => !!r.error).length}`}
              trigger={
                <Label color="orange">
                  {`${results.length - results.filter((r) => !!r.error).length}/${
                    results.length
                  } successful`}
                </Label>
              }
            />
          ) : (
            <Popup
              content={'Executed all queries successfully'}
              trigger={<Label color="green">{`Queries: ${results.length}`}</Label>}
            />
          )}
        </Header>
        <Segment attached>
          {results.map((result, idx) => {
            const TimeLabel = (
              <Popup
                content={`${result.result ? `${result.result.length} in ` : ''}${
                  result.time
                }s`}
                trigger={
                  <Label color="blue" floating style={{ left: 'unset', right: '-1em' }}>
                    {result.result ? `${result.result.length} in ` : ''}
                    {result.time.toFixed(2)}s
                  </Label>
                }
              />
            );
            if (result.error) {
              return (
                <Message negative>
                  {TimeLabel}
                  <Message.Header>{`Error in the ${idx + 1}. query`}</Message.Header>
                  <p>{result.error}</p>
                </Message>
              );
            }
            if (result.result!.length === 0) {
              return (
                <Message positive>
                  {TimeLabel}
                  <Message.Header>{`Successful ${idx + 1}. query`}</Message.Header>
                </Message>
              );
            }
            return (
              <div key={`result-${idx}`} style={{ position: 'relative' }}>
                {TimeLabel}
                <Table celled>
                  <Table.Header>
                    <Table.Row>
                      {Object.keys(result.result![0] || []).map((val, i) => {
                        return <Table.HeaderCell key={i}>{val}</Table.HeaderCell>;
                      })}
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {result.result!.map((val, i) => {
                      return (
                        <Table.Row key={i}>
                          {Object.values(val).map((ds, j) => {
                            return <Table.Cell key={j}>{ds}</Table.Cell>;
                          })}
                        </Table.Row>
                      );
                    })}
                  </Table.Body>
                </Table>
              </div>
            );
          })}
        </Segment>
      </Fragment>
    );
  }
}
