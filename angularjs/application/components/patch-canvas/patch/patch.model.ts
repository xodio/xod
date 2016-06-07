import {NodeModel} from '../node/node.model.ts';
import {Rect} from "../geometry/geometry.lib.ts";

export class PatchModel {
  constructor(public id: number, public name: string, public bbox: Rect, public nodes: Array<NodeModel>) {
  }

  updateName(name: string) {
    return new PatchModel(this.id, name, this.bbox, this.nodes);
  }
}
