import {PatchModel} from './patch.model.ts';
import {NodeModel} from '../node/node.model.ts';

export class PatchSample extends PatchModel {
  constructor() {
    super([new NodeModel(100, 100, 200, 20), new NodeModel(150, 80, 100, 30)]);
  }
}
