import React from 'react';
import { Button, Card, Label, Icon } from 'semantic-ui-react';
import { inject, observer } from 'mobx-react';
import SchemaQueryStore from '../../stores/schema_query_store';
import SchemaQuery from '../../models/SchemaQuery';
import cx from 'classnames';
import Tooltip from '../../shared/Tooltip';
import { computed } from 'mobx';

interface Props {
  schemaQuery: SchemaQuery;
  isActive: boolean;
}

interface InjectedProps extends Props {
  schemaQueryStore: SchemaQueryStore;
}

@inject('schemaQueryStore')
@observer
export default class SchemaQueryCard extends React.Component<Props> {
  get injected() {
    return this.props as InjectedProps;
  }

  @computed
  get schemaQuery() {
    return this.props.schemaQuery;
  }

  render() {
    const rev = this.props.schemaQuery;
    return (
      <Card
        key={rev.id}
        color={this.props.isActive ? 'teal' : undefined}
        onClick={() => this.injected.schemaQueryStore.setSelectedSchemaQueryId(rev.id)}
        className={cx('schema-query-card', { active: this.props.isActive, dirty: this.schemaQuery.isDirty })}
      >
        <Card.Content>
          <div className="card-labels">
            {rev.isDefault && (
              <Tooltip delayed content="This query is used by default to load the database schema.">
                <Label content="default" color="teal" size="mini" />
              </Tooltip>
            )}
            <Tooltip
              delayed
              content={`This schema query is ${rev.isPrivate ? 'only visible to you' : 'publicly visible'}.`}
            >
              <Icon
                name={rev.isPrivate ? 'lock' : 'lock open'}
                size="small"
                bordered
                color={rev.isPrivate ? 'black' : 'yellow'}
              />
            </Tooltip>
          </div>
          <Card.Description>{this.schemaQuery.name}</Card.Description>
          <Card.Meta>{rev.description ?? ''}</Card.Meta>
          <Card.Meta>{rev.createdAt.toLocaleString()}</Card.Meta>
        </Card.Content>
      </Card>
    );
  }
}
