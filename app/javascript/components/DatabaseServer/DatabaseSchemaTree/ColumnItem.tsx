import React from 'react';
import { List, Label, Icon, Card, Table } from 'semantic-ui-react';
import { observer } from 'mobx-react';
import { action } from 'mobx';
import _ from 'lodash';
import DbColumn, { Mark } from '../../../models/DbColumn';
import Tooltip from '../../../shared/Tooltip';
import { SqlTypeMetadata } from '../../../api/db_server';

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
      <div
        className="column-item"
        onMouseOver={() => this.onMouseOver(column)}
        onMouseOut={() => this.onMouseOut(column)}
      >
        <Icon name="columns" color={highlighted ? 'yellow' : 'grey'} />
        <div className={column.isPrimaryKey ? 'primary-key name' : 'name'}>{column.name}</div>
        <div className="spacer" />
        {column.isForeignKey && <Icon name="key" color="grey" />}
        <Tooltip content={<SqlMetaData column={column} />}>
          <Label content={column.sqlTypeMetadata.type} size="mini" basic />
        </Tooltip>
      </div>
    );
  }
}

interface MetaProps {
  column: DbColumn;
}
const SqlMetaData = ({ column }: MetaProps) => {
  const metaData = [
    { name: 'Default', value: column.default || undefined },
    {
      name: 'Primary Key?',
      value: column.isPrimaryKey ? <Icon name="check circle" color="green" /> : undefined
    },
    {
      name: 'Foreign Key?',
      value: column.isForeignKey ? <Icon name="check circle" color="green" /> : undefined
    },
    { name: 'Null?', value: column.isNull ? <Icon name="check circle" color="green" /> : undefined },
    { name: 'Data Type', value: column.sqlTypeMetadata.sql_type || undefined },
    { name: 'Limit', value: column.sqlTypeMetadata.limit || undefined },
    { name: 'Precision', value: column.sqlTypeMetadata.precision || undefined },
    { name: 'Scale', value: column.sqlTypeMetadata.scale || undefined },
    {
      name: 'Referenced By',
      value:
        column.referencedBy.length > 0 ? (
          <List
            bulleted
            style={{ textAlign: 'left' }}
            items={column.referencedBy.map((r) => r.locationName)}
          />
        ) : undefined
    },
    {
      name: 'References',
      value: column.references?.locationName || undefined
    }
  ];

  return (
    <Table basic="very" compact className="column-metadata">
      <Table.Body>
        {metaData
          .filter((d) => d.value)
          .map((data) => (
            <Table.Row key={data.name}>
              <Table.Cell content={data.name} />
              <Table.Cell content={data.value} textAlign="right" />
            </Table.Row>
          ))}
      </Table.Body>
    </Table>
  );
};
