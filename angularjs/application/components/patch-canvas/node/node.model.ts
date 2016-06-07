import {Rect} from '../geometry/geometry.lib.ts';
import {PinModel} from "./pin/pin.model.ts";

export class NodeModel {
  constructor(public id: number, public patchId: number, public bbox: Rect, public label: string, public inputs: Array<PinModel>, public outputs: Array<PinModel>) {
  }

  updateLabel(label: string) {
    return new NodeModel(this.id, this.patchId, this.bbox, label, this.inputs, this.outputs);
  }
}
