import React from 'react';
import { Card, Label, Icon } from 'semantic-ui-react';
import { inject, observer } from 'mobx-react';
import SchemaQueryStore from '../../../stores/schema_query_store';
import SchemaQuery from '../../../models/SchemaQuery';
import cx from 'classnames';
import Tooltip from '../../../shared/Tooltip';
import { computed } from 'mobx';
import Group from '../../../models/Group';
import GroupStore from '../../../stores/group_store';

interface Props {
  group: Group;
  isActive: boolean;
}

interface InjectedProps extends Props {
  groupStore: GroupStore;
}

@inject('groupStore')
@observer
export default class GroupCard extends React.Component<Props> {
  get injected() {
    return this.props as InjectedProps;
  }

  @computed
  get group() {
    return this.props.group;
  }

  @computed
  get name(): string {
    if (this.group.name.length <= 20) {
      return this.group.name;
    }
    return `${this.group.name.slice(0, 20)}...`;
  }

  render() {
    return (
      <Card
        key={this.group.id}
        color={this.props.isActive ? 'teal' : undefined}
        onClick={() => this.group.setAsActiveCard()}
        className={cx('db-sql-card', { active: this.props.isActive, dirty: this.group.isDirty })}
      >
        <Card.Content>
          <div className="card-labels">
            {this.group.isAdmin && (
              <Tooltip delayed content="You are an admin of this group">
                <Label content="admin" color="teal" size="mini" className="main-label" />
              </Tooltip>
            )}
          </div>
          <Card.Header style={{ fontSize: 'medium' }} title={this.group.name}>
            {this.name}
          </Card.Header>
        </Card.Content>
        <Card.Content extra className="stats">
          <Tooltip delayed content={`Used for ${this.group.dbServerCount} database server connections.`}>
            <Label size="mini" color="blue" icon="database" content={this.group.dbServerCount} />
          </Tooltip>
          <Tooltip delayed content={`This group has ${this.group.memberCount} members.`}>
            <Label size="mini" color="blue" icon="group" content={this.group.memberCount} />
          </Tooltip>
          <div className="spacer" />
          <Tooltip delayed content={this.group.isPrivate ? 'This is a private group' : 'This is a public group'}>
            <Icon
              name={this.group.isPrivate ? 'lock' : 'lock open'}
              size="small"
              bordered
              color={this.group.isPrivate ? 'black' : 'yellow'}
            />
          </Tooltip>
        </Card.Content>
      </Card>
    );
  }
}
