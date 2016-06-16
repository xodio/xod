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

  isInput() {
    return this.type === PinType.Input;
  }

  isOutput() {
    return this.type === PinType.Output;
  }
}
