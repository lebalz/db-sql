import React from 'react';
import Popup, { StrictPopupProps } from 'semantic-ui-react/dist/commonjs/modules/Popup/Popup';
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
  delayed?: boolean;
  popupProps?: StrictPopupProps;
}
const DISPLAY_DELAY = 400;

class Tooltip extends React.Component<Props> {
  render() {
    if (this.props.disabled) {
      return this.props.children;
    }

    return (
      <Popup
        trigger={this.props.children}
        popperModifiers={[{ preventOverflow: { boundariesElement: 'offsetParent' } }]}
        content={this.props.content}
        position={this.props.position}
        mouseEnterDelay={this.props.delayed ? DISPLAY_DELAY : 0}
        {...this.props.popupProps}
      />
    );
  }
}

export default Tooltip;
