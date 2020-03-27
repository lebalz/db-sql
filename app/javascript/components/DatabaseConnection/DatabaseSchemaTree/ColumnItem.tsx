import React from 'react';
import { List } from 'semantic-ui-react';
import { observer } from 'mobx-react';
import { action } from 'mobx';
import _ from 'lodash';
import DbColumn, { Mark } from '../../../models/DbColumn';

interface Props {
  column: DbColumn;
}

@observer
export default class ColumnItem extends React.Component<Props> {
  get injected() {
    return this.props as Props;
  }

  @action onMouseOver(column: DbColumn) {
    if (column.foreignColumn) {
      column.mark = Mark.From;
      column.foreignColumn.mark = Mark.To;
    } else if (column.isPrimaryKey) {
      column.mark = Mark.To;
      column.referencedBy.forEach((ref) => (ref.mark = Mark.From));
    }
  }

  @action onMouseOut(column: DbColumn) {
    if (column.foreignColumn) {
      column.mark = Mark.None;
      column.foreignColumn.mark = Mark.None;
    } else if (column.isPrimaryKey) {
      column.mark = Mark.None;
      column.referencedBy.forEach((ref) => (ref.mark = Mark.None));
    }
  }

  render() {
    const { column } = this.injected;
    const highlighted = column.mark !== Mark.None;
    return (
      <List.Item
        as="a"
        className="column-item"
        onMouseOver={() => this.onMouseOver(column)}
        onMouseOut={() => this.onMouseOut(column)}
      >
        <List.Icon name="columns" color={highlighted ? 'yellow' : 'grey'} />
        <List.Content className={column.isPrimaryKey ? 'primary-key' : ''}>
          {column.name}
        </List.Content>
        {column.isForeignKey && <List.Icon name="key" color="grey" />}
      </List.Item>
    );
  }
}
