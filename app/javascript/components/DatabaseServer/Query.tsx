import React, { Fragment } from 'react';
import { Button, Menu, Icon, Segment } from 'semantic-ui-react';
import DbServerStore from '../../stores/db_server_store';
import { inject, observer } from 'mobx-react';
import _ from 'lodash';
import SqlEditor from './SqlEditor';
import SqlResults from './SqlResults';
import { action } from 'mobx';
import { default as DatabaseModel } from '../../models/Database';
import { default as QueryModel } from '../../models/Query';
import { REST } from '../../declarations/REST';
import { RouterStore } from 'mobx-react-router';

interface Props {
  query: QueryModel;
}

@observer
export default class Query extends React.Component<Props> {
  render() {
    return (
      <Fragment>
        <Segment
          attached="bottom"
          style={{ padding: '0.5em 0 0 0', marginBottom: '3em' }}
        >
          <SqlEditor query={this.props.query} />
          <Button
            floated="right"
            positive
            disabled={this.props.query.requestState === REST.Requested}
            loading={this.props.query.requestState === REST.Requested}
            onClick={() => this.props.query.run()}
          >
            Query
          </Button>
        </Segment>
        <SqlResults query={this.props.query} />
      </Fragment>
    );
  }
}
