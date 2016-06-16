import {NodeModel} from '../node/node.model.ts';
import {PinType} from '../node/pin/pin.model.ts';


export class Point {
  constructor(public x: number, public y: number) {
  }

  add(shift: Point) {
    return new Point(this.x + shift.x, this.y + shift.y);
  }
}

export class Rect {
  constructor(public min: Point, public max: Point) {
  }

  width() {
    return this.max.x - this.min.x;
  }

  height() {
    return this.max.y - this.min.y;
  }

  center() {
    return new Point(this.min.x + this.width() / 2, this.min.y + this.height() / 2);
  }

  translate(shift: Point) {
    return new Rect(this.min.add(shift), this.max.add(shift));
  }
}

export class Graphics {

  public static getNodeBbox(position: Point) : Rect {
    let firstPoint = position || new Point( 0, 0 );

    let secondPoint = new Point( firstPoint.x + 120, firstPoint.y + 30 );

    return new Rect( firstPoint, secondPoint );
  }

  public static getPinCenter(pinPosition: Point, absoluteCenter: Point): Point {
    return pinPosition.add(absoluteCenter);
  }

  public static getPinPosition(node: NodeModel, pinType: PinType, pinPosition: number) {
    const inputPinsCount = node.inputPinsIds.length;
    const outputPinsCount = node.outputPinsIds.length;
    const nodeBbox = Graphics.getNodeBbox(node.position);

    let center: Point = null;
    switch (pinType) {
      case PinType.Input:
        center = new Point((pinPosition + 1) * nodeBbox.width() / (inputPinsCount + 1), 0);
        break;
      case PinType.Output:
        center = new Point((pinPosition + 1) * nodeBbox.width() / (outputPinsCount + 1), nodeBbox.height());
        break;
    }
    return center;
  }


}
