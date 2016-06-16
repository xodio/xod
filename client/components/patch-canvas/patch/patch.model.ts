import {NodeModel} from '../node/node.model.ts';
import {Rect} from "../geometry/geometry.lib.ts";
import {LinkModel} from '../link/link.model.ts';
import {IModel} from '../../../share/interfaces.ts';

export class PatchModel implements IModel {
  constructor(public id: number, public name: string, public bbox: Rect, public nodesIds: Array<number>, public linksIds: Array<number>) {
  }

  updateName(name: string) {
    return new PatchModel(this.id, name, this.bbox, this.nodesIds, this.linksIds);
  }
}
