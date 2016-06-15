import { Injectable } from '@angular/core';
import {NodeModel} from './node.model.ts';
import {Rect} from "../geometry/geometry.lib.ts";

@Injectable()
export class NodeService {
  private _nodes = new Map<number, NodeModel>();
  private count = 0;
  private selected: NodeModel = null;

  constructor() {
    console.log('node service');
  }

  create(node: NodeModel) {
    this._nodes[node.id] = node;
    return node;
  }

  resolveNode(nodeId: number) {
    return this._nodes[nodeId];
  }

  reserveId(): number {
    return this.count++;
  }

  node(id: number) {
    return this._nodes[id];
  }

  nodesIds(patchId: number): Array<number> {
    const ids = Object.keys(this._nodes).map(key => this._nodes[key]).filter(node => node.patchId === patchId).map(node => node.id);
    return ids;
  }

  select(node: NodeModel) {
    this.selected = node;
  }

  isSelected(node: NodeModel) {
    if (this.selected && node) {
      return this.selected.patchId === node.patchId && this.selected.id === node.id;
    } else {
      return null;
    }
  }
}
