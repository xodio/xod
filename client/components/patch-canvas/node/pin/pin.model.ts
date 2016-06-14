import {Rect, Point} from "../../geometry/geometry.lib.ts";

export class PinType {
  static Input = 0;
  static Output = 1;
} 

export class PinModel {
  private _nodeBBox: Rect;

  constructor(public pinId: number, public nodeId: number, public position: number, public label: string, public type: PinType, public absoluteCenter: Point) {
    this._nodeBBox = null;
  }

  updateCenter(center: Point) {
    return new PinModel(this.pinId, this.nodeId, this.position, this.label, this.type, center);
  }

  center(inputPinsCount: number, outputPinsCount: number, nodeWidth: number, nodeHeight: number): Point {
    return this.pinPosition(inputPinsCount, outputPinsCount, nodeWidth, nodeHeight).add(this.absoluteCenter);
  }

  // TODO: refactor this wrong placed method
  pinPosition(inputPinsCount: number, outputPinsCount: number, nodeWidth: number, nodeHeight: number): Point {
    let center: Point = null;
    switch (this.type) {
      case PinType.Input:
        center = new Point((this.position + 1) * nodeWidth / (inputPinsCount + 1), 0);
        break;
      case PinType.Output:
        center = new Point((this.position + 1) * nodeWidth / (outputPinsCount + 1), nodeHeight);
        break;
    }
    return center;
  }
}
