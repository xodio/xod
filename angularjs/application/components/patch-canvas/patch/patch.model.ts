import {NodeModel} from '../node/node.model.ts';
import {Rect} from "../geometry/geometry.lib.ts";

export class PatchModel {
  constructor(public name: string, public bbox: Rect, public nodes: Array<NodeModel>) {
  }
}
