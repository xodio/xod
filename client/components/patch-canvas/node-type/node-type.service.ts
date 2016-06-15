import { Injectable } from '@angular/core';
import { INodeType } from './node-type.interface.ts';

@Injectable()
export class NodeTypeService {
  private _types: INodeType[];

  constructor() {   
    this._types = [];
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

  findById(id: number) {
    let result = null;
    const count = this.count();

    for (let i = 0; i < count; i++) {
      if (this._types[i].id === id) {
        result = this._types[i];
        break;
      }
    }

    return result;
  }
}
