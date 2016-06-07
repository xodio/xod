import {PatchModel} from './patch.model.ts';
import {NodeModel} from '../node/node.model.ts';
import {Rect, Point} from '../geometry/geometry.lib.ts';

export class PatchSample extends PatchModel {
  constructor(id: number, name: string) {
    super(
      id,
      name,
      new Rect(new Point(0, 0), new Point(2000, 2000)),
      []
    );
  }
}
