import React from 'react';
import { observer } from 'mobx-react';
import _ from 'lodash';
import { Mark } from '../../../models/DbColumn';
import {
  ItemKind,
  TreeItem,
  DbColumnItem,
  DbTableItem,
  DbSchemaItem,
  LINKABLE_ITEMS
} from './DatabaseSchemaTree';
import { computed } from 'mobx';

type Line = [number, number, number, number];

interface Props {
  menuItems: TreeItem[];
}

type LinkableItem = DbTableItem | DbColumnItem | DbSchemaItem;

@observer
class ForeignColumnLink extends React.Component<Props> {
  @computed
  get linkableItems(): LinkableItem[] {
    return this.props.menuItems.filter((item) => LINKABLE_ITEMS.includes(item.kind)) as LinkableItem[];
  }

  render() {
    const tos = this.linkableItems.filter((col) => col.value.mark === Mark.To);
    const svgHeight = this.props.menuItems.length * 22;
    if (tos.length === 0) {
      return <svg height={svgHeight} width={0} />;
    }
    const to = tos[tos.length - 1] as LinkableItem;
    const from = this.linkableItems.filter((item) => {
      if (item.kind !== ItemKind.Column && item.value.show) {
        return false;
      }
      return item.value.mark === Mark.From;
    }) as LinkableItem[];

    const maxIndent = [...from, ...tos].reduce((max, v) => (max > v.indentLevel ? max : v.indentLevel), 2);
    const svgWidth = maxIndent * 18;
    return (
      <svg height={svgHeight} width={svgWidth}>
        <defs>
          <marker
            id="arrow"
            markerWidth="10"
            markerHeight="10"
            refX="0"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,6 L9,3 z" fill="#f00" />
          </marker>
        </defs>
        {from.map((item) => {
          return <Line key={`${item.value.name}-${item.treePosition}`} from={item} to={to} />;
        })}
      </svg>
    );
  }
}

interface LineProps {
  from: DbColumnItem | DbTableItem | DbSchemaItem;
  to: DbColumnItem | DbTableItem | DbSchemaItem;
}

const FROM_X_SHIFT = 18;
const TO_X_SHIFT = 15;
const TREE_ITEM_HEIGHT = 22;

const Line = (props: LineProps) => {
  const { from, to } = props;
  const fromX = FROM_X_SHIFT * from.indentLevel;
  const toX = to.indentLevel * TO_X_SHIFT;
  const fromY = TREE_ITEM_HEIGHT * from.treePosition + TREE_ITEM_HEIGHT / 2;
  const toY = TREE_ITEM_HEIGHT * to.treePosition + TREE_ITEM_HEIGHT / 2;
  const shiftFactor = Math.max(to.indentLevel, from.indentLevel) > 2 ? 2 : 1;

  return (
    <path
      d={`M${fromX} ${fromY} C ${fromX - shiftFactor * FROM_X_SHIFT} ${fromY},
           ${toX - shiftFactor * FROM_X_SHIFT} ${toY},
           ${toX} ${toY}`}
      stroke="red"
      strokeWidth="1"
      fill="transparent"
      markerEnd="url(#arrow)"
    />
  );
};

export default ForeignColumnLink;
