import { Injectable } from '@angular/core';
import {NodeModel} from './node.model.ts';

@Injectable()
export class NodeService {
  private _nodes = new Map<number, NodeModel>();
  private count = 0;

  constructor() {
  }

  create(node: NodeModel) {
    this._nodes[this.count++] = node;
    node.id = this.count - 1;
    return node;
  }

  nodes() {
    return Object.keys(this._nodes).map(key => this._nodes[key]);
  }
}
