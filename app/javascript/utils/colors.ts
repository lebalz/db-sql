import _ from 'lodash';
export const SEMANTIC_HEX_COLORS = [
  '#db2828',
  '#f2711c',
  '#fbbd08',
  '#b5cc18',
  '#21ba45',
  '#00b5ad',
  '#2185d0',
  '#6435c9',
  '#a333c8',
  '#e03997',
  '#a5673f',
  '#767676',
  '#1b1c1d'
];

export const randomColor = (): string => {
  return _.sample(SEMANTIC_HEX_COLORS)!;
}
