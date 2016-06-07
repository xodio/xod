import {Rect} from '../geometry/geometry.lib.ts';

export class NodeModel {
  constructor(public id: number, public patchId: number, public bbox: Rect, public label: string) {
  }
}
