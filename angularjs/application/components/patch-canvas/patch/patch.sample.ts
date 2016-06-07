import {PatchModel} from './patch.model.ts';
import {NodeModel} from '../node/node.model.ts';
import {Rect, Point} from '../geometry/geometry.lib.ts';

export class PatchSample extends PatchModel {
  constructor(id: number, name: string) {
    super(
      id,
      name,
      new Rect(new Point(100, 100), new Point(300, 400)),
      [
        new NodeModel(100, 100, 200, 20),
        new NodeModel(150, 80, 100, 30)
      ]
    );
  }
}
