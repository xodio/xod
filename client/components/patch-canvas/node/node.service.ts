import { Injectable } from '@angular/core';
import {NodeModel} from './node.model.ts';
import {Rect} from "../geometry/geometry.lib.ts";
import {IServiceState} from '../../../share/interfaces.ts';

@Injectable()
export class NodeService {
  private _state: IServiceState;

  constructor() {
    this._state = {
      models: new Map<number, NodeModel>(),
      selected: null,
      count: 0
    };

    console.log('node service');
  }

  create(node: NodeModel) {
    this._state.models[node.id] = node;
    return node;
  }

  resolveNode(nodeId: number) {
    return this._state.models[nodeId];
  }

  reserveId(): number {
    return this._state.count++;
  }

  node(id: number) {
    return this._state.models[id];
  }

  nodesIds(patchId: number): Array<number> {
    const ids = Object.keys(this._state.models).map(key => this._state.models[key]).filter(node => node.patchId === patchId).map(node => node.id);
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
