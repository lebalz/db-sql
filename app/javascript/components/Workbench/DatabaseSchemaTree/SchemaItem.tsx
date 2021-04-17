import React from 'react';
import { Icon, List } from 'semantic-ui-react';
import { observer } from 'mobx-react';
import _ from 'lodash';
import { Mark } from '../../../models/DbColumn';
import DbSchema from '../../../models/DbSchema';

interface DatabaseItemProps {
  schema: DbSchema;
}

@observer
export default class SchemaItem extends React.Component<DatabaseItemProps> {
  render() {
    const { schema } = this.props;
    const highlighted = schema.mark !== Mark.None;

    return (
      <List.Item as="a" className="schema-item" onClick={(e) => schema.toggleShow()}>
        <List.Content>
          <div style={{ display: 'flex' }}>
            <Icon fitted name="sitemap" color={highlighted ? 'yellow' : 'grey'} />
            <span style={{ marginLeft: '10px' }}>{schema.name}</span>
          </div>
        </List.Content>
      </List.Item>
    );
  }
}
