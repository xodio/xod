import {Point} from "../geometry/geometry.lib.ts";

export class LinkModel {
  constructor(public id: number, public patchId: number, public inputPinId: number, public outputPinId: number) {
  }
}

export class LinkPosition {
  constructor(public input: Point, public output: Point) {
  }
}
