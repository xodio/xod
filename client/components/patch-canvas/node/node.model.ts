import {Point} from '../geometry/geometry.lib.ts';
import {PinModel} from "./pin/pin.model.ts";
import {IModel} from '../../../share/interfaces.ts';

export class NodeModel implements IModel {
  constructor(public id: number, public patchId: number, public position: Point, public label: string, public inputPinsIds: Array<number>, public outputPinsIds: Array<number>, public nodeTypeId: number) {
  }

  updateLabel(label: string) {
    return new NodeModel(this.id, this.patchId, this.position, label, this.inputPinsIds, this.outputPinsIds, this.nodeTypeId);
  }
}
