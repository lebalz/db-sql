import React from 'react';
import Popup from 'semantic-ui-react/dist/commonjs/modules/Popup/Popup';
import { SemanticShorthandItem } from 'semantic-ui-react/dist/commonjs/generic';
import { PopupContentProps } from 'semantic-ui-react';

export type PopupPosition =
  | 'top left'
  | 'top right'
  | 'bottom right'
  | 'bottom left'
  | 'right center'
  | 'left center'
  | 'top center'
  | 'bottom center'
  | undefined;

interface Props {
  content: SemanticShorthandItem<PopupContentProps>;
  position?: PopupPosition;
  disabled?: boolean;
}

class Tooltip extends React.Component<Props> {
  render() {
    if (this.props.disabled) {
      return this.props.children;
    }

    return (
      <Popup
        trigger={this.props.children}
        content={this.props.content}
        popperModifiers={{ preventOverflow: { boundariesElement: 'offsetParent' } }}
        position={this.props.position}
      />
    );
  }
}

export default Tooltip;
