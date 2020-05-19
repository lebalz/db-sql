import React from 'react';

interface Props {
  direction: 'horizontal' | 'vertical';
  id?: string;
  minSize?: number;
  defaultSize: number;
  shift?: number;
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

  render() {
    return (
      <div
        id={this.props.id}
        className={`divider ${this.props.direction}`}
        ref={this.ref}
        onPointerDown={this.beginSliding}
        onPointerUp={this.stopSliding}
      />
    );
  }
}

export default Slider;
