import {Rect} from '../geometry/geometry.lib.ts';
import {PinModel} from "./pin/pin.model.ts";

export class NodeModel {
  constructor(public id: number, public patchId: number, public bbox: Rect, public label: string, public inputPinsIds: Array<number>, public outputPinsIds: Array<number>) {
  }

  updateLabel(label: string) {
    return new NodeModel(this.id, this.patchId, this.bbox, label, this.inputPinsIds, this.outputPinsIds);
  }
}
