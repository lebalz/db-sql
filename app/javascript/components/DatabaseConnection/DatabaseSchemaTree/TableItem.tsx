import React from 'react';
import { Icon, List } from 'semantic-ui-react';
import { observer } from 'mobx-react';
import _ from 'lodash';
import DbTable from '../../../models/DbTable';
import { Mark } from '../../../models/DbColumn';

interface DatabaseItemProps {
  table: DbTable;
}

@observer
export default class TableItem extends React.Component<DatabaseItemProps> {
  get injected() {
    return this.props as DatabaseItemProps;
  }

  render() {
    const { table } = this.injected;
    const highlighted = table.mark !== Mark.None;

    return (
      <List.Item as="a" className="table-item" onClick={(e) => table.toggleShow()}>
        <List.Content>
          <div style={{ display: 'flex' }}>
            {table.hasPendingRequest ? (
              <Icon loading name="circle notch" />
            ) : (
              <Icon fitted name="table" color={highlighted ? 'yellow' : 'grey'} />
            )}
            <span style={{ marginLeft: '10px' }}>{table.name}</span>
          </div>
        </List.Content>
      </List.Item>
    );
  }
}