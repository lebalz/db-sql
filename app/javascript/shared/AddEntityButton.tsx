import React from 'react';
import { observer } from 'mobx-react';
import { Button, SemanticSIZES } from 'semantic-ui-react';

interface Props {
  style?: React.CSSProperties[] | React.CSSProperties;
  onClick: () => void;
  title: string;
  size?: SemanticSIZES;
}

@observer
export default class AddEntityButton extends React.Component<Props> {
  render() {
    return (
      <Button
        style={{
          justifySelf: 'start',
          alignSelf: 'end',
          ...this.props.style
        }}
        icon="add"
        size={this.props.size ?? 'large'}
        title={this.props.title}
        circular
        onClick={this.props.onClick}
      />
    );
  }
}
