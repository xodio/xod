import { Injectable } from '@angular/core';
import {NodeModel} from './node.model.ts';
import {Rect} from "../geometry/geometry.lib.ts";

interface INodeServiceState {
  nodes: Map<number, NodeModel>,
  selected: NodeModel,
  count: number
}

@Injectable()
export class NodeService {
  private _state: INodeServiceState;

  constructor() {
    this._state = {
      nodes: new Map<number, NodeModel>(),
      selected: null,
      count: 0
    };

    console.log('node service');
  }

  create(node: NodeModel) {
    this._state.nodes[node.id] = node;
    return node;
  }

  resolveNode(nodeId: number) {
    return this._state.nodes[nodeId];
  }

  reserveId(): number {
    return this._state.count++;
  }

  node(id: number) {
    return this._state.nodes[id];
  }

  nodesIds(patchId: number): Array<number> {
    const ids = Object.keys(this._state.nodes).map(key => this._state.nodes[key]).filter(node => node.patchId === patchId).map(node => node.id);
    return ids;
  }

  select(node: NodeModel) {
    this._state.selected = node;
  }

  isSelected(node: NodeModel) {
    if (this._state.selected && node) {
      return this._state.selected.patchId === node.patchId && this._state.selected.id === node.id;
    } else {
      return null;
    }
  }
}
