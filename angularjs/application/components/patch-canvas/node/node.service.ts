import { Injectable } from '@angular/core';
import {NodeModel} from './node.model.ts';

@Injectable()
export class NodeService {
  private _nodes = new Map<number, NodeModel>();
  private count = 0;
  private selected: NodeModel = null;

  constructor() {
  }

  create(node: NodeModel) {
    this._nodes[this.count++] = node;
    node.id = this.count - 1;
    return node;
  }

  node(id: number) {
    return this._nodes[id];
  }

  nodes() {
    return Object.keys(this._nodes).map(key => this._nodes[key]);
  }

  select(node) {
    this.selected = node;
  }

  isSelected(node) {
    if (this.selected && node) {
      return this.selected.patchId === node.patchId && this.selected.id === node.id;
    } else {
      return null;
    }
  }
}
