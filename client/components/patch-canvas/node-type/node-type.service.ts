import { Injectable } from '@angular/core';
import { INodeType } from './node-type.interface.ts';

interface INodeTypeServiceState {
  types: INodeType[],
  selected: INodeType
}

@Injectable()
export class NodeTypeService {
  private _state: INodeTypeServiceState;

  constructor() {   
    this._state = {
      types: [],
      selected: null
    };
  }

  add(nodeType: INodeType) {
    this._state.types.push(nodeType);

    this.setDefaultSelection();
  }

  addFromArray(nodeTypes: INodeType[]) {
    this._state.types = this._state.types.concat(nodeTypes);

    this.setDefaultSelection();
  }

  parseJSON(json: string) {
    const data = JSON.parse(json);

    this.addFromArray( data );
  }

  types() {
    return this._state.types;
  }

  count() {
    return this._state.types.length;
  }

  setSelected(id: number) {
    const type = this.findById(id);
    this._state.selected = type;
  }

  selected() {
    return this._state.selected;
  }

  setDefaultSelection() {
    if (this._state.selected === null && this._state.types.length > 0) {
      this._state.selected = this._state.types[0];
    }
  }

  get(index: number) {
    let i = index;
    const count = this.count();

    if (i < 0 && count > 0) {
      i = count + i;
    }

    if (i > 0 && count > i) {
      return this._state.types[index];
    }

    return null;
  }

  findById(id: any) {
    let result = null;
    const count = this.count();

    id = (typeof id === 'number') ? id : parseInt(id);

    for (let i = 0; i < count; i++) {
      if (this._state.types[i].id === id) {
        result = this._state.types[i];
        break;
      }
    }

    return result;
  }
}
