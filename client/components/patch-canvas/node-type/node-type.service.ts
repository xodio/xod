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
}
