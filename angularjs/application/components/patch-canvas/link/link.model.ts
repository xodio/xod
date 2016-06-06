import {NodeModel} from '../node/node.model.ts';

export class EdgeModel {
  constructor(public input: NodeModel, public output: NodeModel) {
  }
}
