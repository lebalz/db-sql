import React from 'react';
import { Icon } from 'semantic-ui-react';

type CollapseDirection = 'left' | 'right' | 'up' | 'down';

interface Props {
  direction: 'horizontal' | 'vertical';
  id?: string;
  minSize?: number;
  defaultSize: number;
  shift?: number;
  hideIcon?: boolean;
  collapseDirection?: CollapseDirection;
  /**
   * position relative to the divider line
   */
  iconPosition?: {
    top?: string;
    left?: string;
    right?: string;
    bottom?: string;
  };
  onChange: (size: number) => void;
}

type CollapsIcon = 'triangle left' | 'triangle right' | 'triangle up' | 'triangle down';
type CollapseIconMap = {
  [key in CollapseDirection]: CollapsIcon;
};

const collapseIconMap: CollapseIconMap = {
  left: 'triangle left',
  right: 'triangle right',
  up: 'triangle up',
  down: 'triangle down'
};

const flippedCollapseIconMap: CollapseIconMap = {
  right: 'triangle left',
  left: 'triangle right',
  down: 'triangle up',
  up: 'triangle down'
};

class Slider extends React.Component<Props> {
  ref = React.createRef<HTMLDivElement>();
  state: { pointerDown: boolean; share: number; oldShare?: number } = {
    pointerDown: false,
    share: this.props.defaultSize
  };

  get minSize(): number {
    return this.props.minSize ?? 0;
  }

  get shift(): number {
    return this.props.shift ?? 0;
  }

  beginSliding = (e: React.PointerEvent<HTMLDivElement>) => {
    if (((e.target as any).classList ?? []).contains('toggleIcon')) {
      return;
    }
    if (this.ref.current) {
      this.ref.current.addEventListener('pointermove', this.slide, true);
      this.ref.current.setPointerCapture(e.pointerId);
    }
  };

  stopSliding = (e: React.PointerEvent<HTMLDivElement>) => {
    if (this.ref.current) {
      this.ref.current.removeEventListener('pointermove', this.slide, true);
      this.ref.current.releasePointerCapture(e.pointerId);
    }
  };

  slideHorizontal = (e: PointerEvent) => {
    const leftShare = Math.max(Math.max(0, e.clientX + this.shift), this.minSize);

    this.setState({ share: leftShare });
  };

  slideVertical = (e: PointerEvent) => {
    const topShare = Math.max(Math.max(0, e.clientY + this.shift), this.minSize);

    this.setState({ share: topShare });
  };

  toggleCollapse = (e: PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    let newState = { share: this.state.share, oldShare: this.state.share };
    if (this.isCollapsed) {
      newState.share = this.state.oldShare ?? this.minSize;
    } else {
      newState.share = 0;
    }
    this.setState(newState);
    this.props.onChange(newState.share);
  };

  slide = (e: PointerEvent) => {
    switch (this.props.direction) {
      case 'horizontal':
        this.slideHorizontal(e);
        break;
      case 'vertical':
        this.slideVertical(e);
        break;
      default:
        break;
    }
    this.props.onChange(this.state.share);
  };

  get iconName(): 'resize horizontal' | 'resize vertical' {
    return `resize ${this.props.direction}` as 'resize horizontal' | 'resize vertical';
  }

  iconStyle(defaultSpace = '1em', align: 'center' | 'start' | 'end' = 'center') {
    const center = align === 'center' ? '-1em' : undefined;
    switch (this.props.direction) {
      case 'horizontal':
        const defaultTop = this.props.iconPosition?.bottom ? undefined : defaultSpace;
        const end = align === 'end' ? '0' : undefined;
        return {
          left: center,
          right: end,
          top: this.props.iconPosition?.top ?? defaultTop,
          bottom: this.props.iconPosition?.bottom
        };
      case 'vertical':
        const defaultLeft = this.props.iconPosition?.right ? undefined : defaultSpace;
        const bottom = align === 'end' ? '0' : undefined;
        return {
          top: center,
          bottom: bottom,
          left: this.props.iconPosition?.left ?? defaultLeft,
          right: this.props.iconPosition?.right
        };
      default:
        return {};
    }
  }

  get canCollapse(): boolean {
    return this.props.collapseDirection !== undefined;
  }

  get isCollapsed(): boolean {
    return this.state.share === 0;
  }

  collapseIconName() {
    if (!this.props.collapseDirection) {
      throw new Error('No collapse direction given');
    }
    return this.isCollapsed
      ? flippedCollapseIconMap[this.props.collapseDirection]
      : collapseIconMap[this.props.collapseDirection];
  }

  render() {
    return (
      <div
        id={this.props.id}
        className={`divider ${this.props.direction}`}
        ref={this.ref}
        onPointerDown={this.beginSliding}
        onPointerUp={this.stopSliding}
      >
        {!this.props.hideIcon && !this.isCollapsed && (
          <Icon circular name={this.iconName} style={this.iconStyle('1em')} className="resizeIcon" />
        )}
        {this.canCollapse && (
          <Icon
            name={this.collapseIconName()}
            style={this.iconStyle(this.props.hideIcon ? '1em' : '3em', 'start')}
            className={`toggleIcon ${this.props.collapseDirection}`}
            onClick={(e: PointerEvent) => this.toggleCollapse(e)}
          />
        )}
      </div>
    );
  }
}

export default Slider;
