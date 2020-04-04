import React from 'react';
import { Table, Label, Popup } from 'semantic-ui-react';
import _ from 'lodash';
import { ResultTable as ResulTableType } from '../../api/db_server';
import { computed } from 'mobx';

interface Props {
  table: ResulTableType;
}

export default class ResultTable extends React.Component<Props> {
  @computed
  get result() {
    return this.props.table;
  }
  @computed
  get headers() {
    if (this.result.length === 0) {
      return [];
    }
    return Object.keys(this.result[0]);
  }

  render() {
    return (
      <div style={{ position: 'relative' }}>
        <Table celled style={{ paddingLeft: 0, paddingRight: 0 }}>
          <Table.Header>
            <Table.Row>
              {this.headers.map((key, i) => {
                return <Table.HeaderCell key={i}>{key}</Table.HeaderCell>;
              })}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {this.result.map((val, i) => {
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
  }
}