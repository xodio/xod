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

  toJS() {
    return {
      position: this.getPosition(),
      center: this.getCenter(),
      absCenter: this.getAbsCenter(),
      absMax: this.getAbsMax(),
    };
  }

  addPosition(addBbox) {
    return new Bbox({
      x: this.props.x + addBbox.getPosition().x,
      y: this.props.y + addBbox.getPosition().y,
      width: this.props.width,
      height: this.props.width,
    });
  }
}
