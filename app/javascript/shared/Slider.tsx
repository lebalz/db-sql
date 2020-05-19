import React from 'react';
import { Icon } from 'semantic-ui-react';

interface Props {
  direction: 'horizontal' | 'vertical';
  id?: string;
  minSize?: number;
  defaultSize: number;
  shift?: number;
  hideIcon?: boolean;
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

class Slider extends React.Component<Props> {
  ref = React.createRef<HTMLDivElement>();
  state: { pointerDown: boolean; share: number } = { pointerDown: false, share: this.props.defaultSize };

  get minSize(): number {
    return this.props.minSize ?? 0;
  }

  get shift(): number {
    return this.props.shift ?? 0;
  }

  beginSliding = (e: React.PointerEvent<HTMLDivElement>) => {
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

  get iconStyle() {
    switch (this.props.direction) {
      case 'horizontal':
        const defaultTop = this.props.iconPosition?.bottom ? undefined : '1em';
        return {
          left: '-1em',
          top: this.props.iconPosition?.top ?? defaultTop,
          bottom: this.props.iconPosition?.bottom
        };
      case 'vertical':
        const defaultLeft = this.props.iconPosition?.right ? undefined : '1em';
        return {
          top: '-1em',
          left: this.props.iconPosition?.left ?? defaultLeft,
          right: this.props.iconPosition?.right
        };
      default:
        return {};
    }
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
        {!this.props.hideIcon && (
          <Icon circular name={this.iconName} style={this.iconStyle} className="resizeIcon" />
        )}
      </div>
    );
  }
}

export default Slider;
