import React from 'react';
import { Card, Label, Icon } from 'semantic-ui-react';
import { inject, observer } from 'mobx-react';
import SchemaQueryStore from '../../../stores/schema_query_store';
import SchemaQuery from '../../../models/SchemaQuery';
import cx from 'classnames';
import Tooltip from '../../../shared/Tooltip';
import { computed } from 'mobx';

interface Props {
  schemaQuery: SchemaQuery;
  isActive: boolean;
  onSelect: () => void
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

  @computed
  get name(): string {
    if (this.schemaQuery.name.length <= 16) {
      return this.schemaQuery.name;
    }
    return `${this.schemaQuery.name.slice(0, 16)}...`;
  }

  render() {
    const rev = this.props.schemaQuery;
    return (
      <Card
        key={rev.id}
        color={this.props.isActive ? 'teal' : undefined}
        onClick={() => this.props.onSelect()}
        className={cx('schema-query-card', { active: this.props.isActive, dirty: this.schemaQuery.isDirty })}
      >
        <Card.Content>
          <div className="card-labels">
            {rev.isDefault && (
              <Tooltip delayed content="This query is used by default to load the database schema.">
                <Label content="default" color="teal" size="mini" className="default-label" />
              </Tooltip>
            )}
          </div>
          <Card.Header style={{ fontSize: 'medium' }} title={this.schemaQuery.name}>
            {this.name}
          </Card.Header>
          <Card.Meta>{rev.createdAt.toLocaleString()}</Card.Meta>
          <Card.Description>{rev.description}</Card.Description>
        </Card.Content>
        <Card.Content extra className="usage-stats">
          {rev.isPublic && (
            <Tooltip delayed content={`Used by ${rev.stats.public_user_count} other users.`}>
              <Label size="mini" color="blue" icon="user" content={rev.stats.public_user_count} />
            </Tooltip>
          )}
          <Tooltip delayed content={`Used for ${rev.stats.reference_count} database server connections.`}>
            <Label size="mini" color="blue" icon="server" content={rev.stats.reference_count} />
          </Tooltip>
          <div className="spacer" />
          {rev.canEdit && (
            <Tooltip delayed content={`You are the author.`}>
              <Icon size="small" name="edit" bordered color="blue" />
            </Tooltip>
          )}
          <Tooltip delayed content={`${rev.isPrivate ? 'only visible to you' : 'publicly visible'}.`}>
            <Icon
              name={rev.isPrivate ? 'lock' : 'lock open'}
              size="small"
              bordered
              color={rev.isPrivate ? 'black' : 'yellow'}
            />
          </Tooltip>
        </Card.Content>
      </Card>
    );
  }
}
