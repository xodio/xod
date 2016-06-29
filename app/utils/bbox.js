export default class Bbox {
  constructor(props) {
    this.props = props;
  }

  getPosition() {
    return {
      x: this.props.x,
      y: this.props.y,
    };
  }

  getSize() {
    return {
      width: this.props.width,
      height: this.props.height,
    };
  }

  getCenter() {
    return {
      x: this.props.width / 2,
      y: this.props.height / 2,
    };
  }

  getAbsCenter() {
    return {
      x: this.props.x + this.getCenter().x,
      y: this.props.y + this.getCenter().y,
    };
  }

  getAbsMax() {
    return {
      x: this.props.x + this.props.width,
      y: this.props.y + this.props.height,
    };
  }

  translate(extent) {
    let plusPosition = {
      x: 0,
      y: 0,
    };

    if (extent instanceof Bbox) {
      plusPosition = extent.getPosition();
    } else {
      plusPosition.x += (Object.hasOwnProperty.call(extent, 'x')) ? extent.x : 0;
      plusPosition.y += (Object.hasOwnProperty.call(extent, 'y')) ? extent.y : 0;
    }

    return new Bbox({
      x: this.props.x + plusPosition.x,
      y: this.props.y + plusPosition.y,
      width: this.props.width,
      height: this.props.width,
    });
  }
}
