import {Rect, Point} from "../../geometry/geometry.lib.ts";
import {IModel} from '../../../../share/interfaces.ts';

export class PinType {
  static Input = 0;
  static Output = 1;
} 

export class PinModel implements IModel {
  private _nodeBBox: Rect;

  constructor(public id: number, public nodeId: number, public position: number, public label: string, public type: PinType, public absoluteCenter: Point) {
    this._nodeBBox = null;
  }

  updateCenter(center: Point) {
    return new PinModel(this.id, this.nodeId, this.position, this.label, this.type, center);
  }
}
