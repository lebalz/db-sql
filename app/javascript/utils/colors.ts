import _ from 'lodash';
export const SEMANTIC_HEX_COLORS = [
  '#db2828',
  '#21ba45',
  '#2185d0',
  '#1b1c1d',
  '#e03997',
  '#6435c9',
  '#00b5ad',
  '#f2711c',
  '#b5cc18',
  '#fbbd08',
  '#a5673f',
  '#a333c8',
  '#767676'
];

export const randomColor = (): string => {
  return _.sample(SEMANTIC_HEX_COLORS)!;
}
