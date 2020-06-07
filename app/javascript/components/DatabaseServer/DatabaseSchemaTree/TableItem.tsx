import React from 'react';
import { Icon, List } from 'semantic-ui-react';
import { observer } from 'mobx-react';
import _ from 'lodash';
import DbTable from '../../../models/DbTable';
import { Mark } from '../../../models/DbColumn';

interface DatabaseItemProps {
  table: DbTable;
  indentLevel: 1 | 2;
}

@observer
export default class TableItem extends React.Component<DatabaseItemProps> {
  render() {
    const { table, indentLevel } = this.props;
    const highlighted = table.mark !== Mark.None;

    return (
      <List.Item
        as="a"
        className="table-item"
        style={{ marginLeft: `${indentLevel}em` }}
        onClick={(e) => table.toggleShow()}
      >
        <List.Content>
          <div style={{ display: 'flex' }}>
            <Icon fitted name="table" color={highlighted ? 'yellow' : 'grey'} />
            <span style={{ marginLeft: '10px' }}>{table.name}</span>
          </div>
        </List.Content>
      </List.Item>
    );
  }
}
