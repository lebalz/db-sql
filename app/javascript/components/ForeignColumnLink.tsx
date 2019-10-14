import React from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react';
import { MenuItemDb, DbColumnItem, DbTableItem } from './Connections';
import _ from 'lodash';
import { Mark } from '../models/DbColumn';

type Line = [number, number, number, number];

interface Props {
  menuItems: MenuItemDb[];
}

@observer
class ForeignColumnLink extends React.Component<Props> {

  render() {
    const { menuItems } = this.props;
    const tos = menuItems.filter(col => col.kind !== 'database' && col.obj.mark === Mark.To);
    const svgWidth = 36;
    const svgHeight = menuItems.length * 22;
    if (tos.length < 1) {
      return <svg height={svgHeight} width={svgWidth} />;
    }
    const to = tos[tos.length - 1] as (DbColumnItem | DbTableItem);
    const from = menuItems.filter((item) => {
      if (item.kind === 'database') {
        return false;
      }
      if (item.kind === 'table' && item.obj.show) {
        return false;
      }
      return item.obj.mark === Mark.From;
    }) as (DbColumnItem | DbTableItem)[];

    return (
      <svg height={svgHeight} width={svgWidth} >
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
          return (
            <Line
              key={`${item.obj.name}-${item.pos}`}
              from={item}
              to={to}
            />
          );
        })
        }
      </svg>
    );
  }
}

interface LineProps {
  from: DbColumnItem | DbTableItem;
  to: DbColumnItem | DbTableItem;
}

function Line(props: LineProps) {
  const { from, to } = props;
  const fromX = from.kind === 'column' ? 36 : 18;
  const toX = to.kind === 'column' ? 30 : 15;
  const fromY = 22 * from.pos + 11;
  const toY = 22 * to.pos + 11;
  const dY = Math.sign(toY - fromY) * 0;

  return (
    <path
      d={`M${fromX} ${fromY} C ${fromX - 18} ${fromY + dY}, ${toX - 18} ${toY}, ${toX} ${toY}`}
      stroke="red"
      strokeWidth="1"
      fill="transparent"
      markerEnd="url(#arrow)"
    />
  );
}


export default ForeignColumnLink;