import React from 'react';
import { observer } from 'mobx-react';
import _ from 'lodash';
import { Mark } from '../../../models/DbColumn';
import { ItemKind, TreeItem, DbColumnItem, DbTableItem } from './DatabaseSchemaTree';
import { computed } from 'mobx';

type Line = [number, number, number, number];

interface Props {
  menuItems: TreeItem[];
}

@observer
class ForeignColumnLink extends React.Component<Props> {
  @computed
  get linkableItems(): (DbTableItem | DbColumnItem)[] {
    return this.props.menuItems.filter(
      (item) => item.kind === ItemKind.Column || item.kind === ItemKind.Table
    ) as (DbTableItem | DbColumnItem)[];
  }
  render() {
    const tos = this.linkableItems.filter((col) => col.value.mark === Mark.To);
    const svgWidth = 36;
    const svgHeight = this.props.menuItems.length * 22;
    if (tos.length < 1) {
      return <svg height={svgHeight} width={svgWidth} />;
    }
    const to = tos[tos.length - 1] as DbColumnItem | DbTableItem;
    const from = this.linkableItems.filter((item) => {
      if (item.kind === ItemKind.Table && item.value.show) {
        return false;
      }
      return item.value.mark === Mark.From;
    }) as (DbColumnItem | DbTableItem)[];

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
  from: DbColumnItem | DbTableItem;
  to: DbColumnItem | DbTableItem;
}

const FROM_X_SHIFT = 18;
const TO_X_SHIFT = 15;
const TREE_ITEM_HEIGHT = 22;

const Line = (props: LineProps) => {
  const { from, to } = props;
  const fromX = from.kind === ItemKind.Column ? FROM_X_SHIFT * 2 : FROM_X_SHIFT;
  const toX = to.kind === ItemKind.Column ? 2 * TO_X_SHIFT : TO_X_SHIFT;
  const fromY = TREE_ITEM_HEIGHT * from.treePosition + TREE_ITEM_HEIGHT / 2;
  const toY = TREE_ITEM_HEIGHT * to.treePosition + TREE_ITEM_HEIGHT / 2;
  const dY = Math.sign(toY - fromY) * 0;

  return (
    <path
      d={`M${fromX} ${fromY} C ${fromX - FROM_X_SHIFT} ${fromY + dY}, ${
        toX - FROM_X_SHIFT
      } ${toY}, ${toX} ${toY}`}
      stroke="red"
      strokeWidth="1"
      fill="transparent"
      markerEnd="url(#arrow)"
    />
  );
};

export default ForeignColumnLink;
