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
  }

  addFromArray(nodeTypes: INodeType[]) {
    this._types = this._types.concat(nodeTypes);
  }

  parseJSON(json: string) {
    const data = JSON.parse(json);

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
        console.log('--->', typeof this._types[i].id, typeof id);
        result = this._types[i];
        break;
      }
    }

    return result;
  }
}
