import {Point} from "../geometry/geometry.lib.ts";
import {IModel} from '../../../share/interfaces.ts';

export class LinkModel implements IModel {
  constructor(public id: number, public patchId: number, public inputPinId: number, public outputPinId: number) {
  }
}

export class LinkPosition {
  constructor(public input: Point, public output: Point) {
  }
}
