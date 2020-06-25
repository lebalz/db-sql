import React from 'react';
import Tooltip from './Tooltip';
import { Icon, IconProps, SemanticICONS, SemanticCOLORS, PopupContentProps } from 'semantic-ui-react';
import cx from 'classnames';
import { SemanticShorthandItem } from 'semantic-ui-react/dist/commonjs/generic';

type tooltipPosition =
  | 'top left'
  | 'top right'
  | 'bottom right'
  | 'bottom left'
  | 'right center'
  | 'left center'
  | 'top center'
  | 'bottom center';

interface Props extends IconProps {
  tooltip?: SemanticShorthandItem<PopupContentProps>;
  tooltipPosition?: tooltipPosition;
  icon: SemanticICONS;
  backfaceIcon?: SemanticICONS;
  backfaceColor?: SemanticCOLORS;
  delayed?: boolean;
}

function ClickableIcon(props: Props) {
  const { tooltip, tooltipPosition, delayed, ...rest } = props;
  const icon = <BackfaceIcon {...rest} />;

  return tooltip ? (
    <Tooltip content={tooltip} position={tooltipPosition} delayed={delayed}>
      {icon}
    </Tooltip>
  ) : (
    icon
  );
}

const BackfaceIcon = (props: Props) => {
  const { icon, backfaceColor, backfaceIcon, ...rest } = props;

  const { disabled, onClick, loading, style, className, ...iconProps } = rest;

  const click = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onClick && !disabled) {
      onClick(e);
    }
  };
  const ico = (
    <Icon
      className={cx('clickable-icon', 'front', className)}
      name={loading ? 'circle notch' : icon}
      loading={loading}
      onClick={click}
      disabled={disabled}
      style={{ cursor: disabled ? '' : 'pointer', ...style }}
      {...iconProps}
    />
  );
  if (!disabled && (backfaceColor || backfaceIcon)) {
    return (
      <div className={cx('flipable-icon', iconProps.size)}>
        {ico}
        <Icon
          className={cx('clickable-icon', 'back', className)}
          name={loading ? 'circle notch' : backfaceIcon ?? icon}
          loading={loading}
          onClick={click}
          disabled={disabled}
          style={{ cursor: disabled ? '' : 'pointer', ...style }}
          {...iconProps}
          color={backfaceColor ?? iconProps.color}
        />
      </div>
    );
  }
  return ico;
};

export default ClickableIcon;
