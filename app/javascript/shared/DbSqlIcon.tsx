import React from 'react';
import { Icon } from 'semantic-ui-react';
import { IconSizeProp } from 'semantic-ui-react/dist/commonjs/elements/Icon/Icon';

interface Props {
  size?: IconSizeProp;
}

export default class DbSqlIcon extends React.Component<Props> {
  render() {
    return (
      <Icon.Group size={this.props.size || 'small'}>
        <Icon circular inverted color="teal" name="gem" />
        <Icon corner="bottom right" color="violet" name="database" />
      </Icon.Group>
    );
  }
}
