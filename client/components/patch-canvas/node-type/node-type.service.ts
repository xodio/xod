import { Injectable } from '@angular/core';
import { INodeType } from './node-type.interface.ts';

@Injectable()
export class NodeTypeService {
  private _types: INodeType[];
  private _selected: INodeType;

  constructor() {   
    this._types = [];
    this._selected = null;
  }

  add(nodeType: INodeType) {
    this._types.push(nodeType);

    this.setDefaultSelection();
  }

  addFromArray(nodeTypes: INodeType[]) {
    this._types = this._types.concat(nodeTypes);

    this.setDefaultSelection();
  }

  parseJSON(json: string) {
    const data = JSON.parse(json);

    // @TODO: Add conversion of inputs/outputs types from strings into numbers (using enum PinType)
    this.addFromArray( data );
  }

  types() {
    return this._types;
  }

  count() {
    return this._types.length;
  }

  setSelected(id: number) {
    const type = this.findById(id);
    this._selected = type;
  }

  selected() {
    return this._selected;
  }

  setDefaultSelection() {
    if (this._selected === null && this._types.length > 0) {
      this._selected = this._types[0];
    }
  }

  get(index: number) {
    let i = index;
    const count = this.count();

    if (i < 0 && count > 0) {
      i = count + i;
    }

    if (i > 0 && count > i) {
      return this._types[index];
    }

    return null;
  }

  findById(id: any) {
    let result = null;
    const count = this.count();

    id = (typeof id === 'number') ? id : parseInt(id);

    for (let i = 0; i < count; i++) {
      if (this._types[i].id === id) {
        result = this._types[i];
        break;
      }
    }

    return result;
  }
}
