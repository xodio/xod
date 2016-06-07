import {Injectable} from '@angular/core';
import {PatchSample} from './patch.sample.ts';
import {PatchModel} from './patch.model.ts';

@Injectable()
export class PatchService {
  private _patches: Map<number, PatchModel>;
  private selected: PatchModel;
  private count: number = 0;

  patchesAsArray() {
    return Object.keys(this._patches).map(key => this._patches[key]);
  }

  constructor() {
    this._patches = new Map<number, PatchModel>();
    this.create(new PatchSample(0, "Test"));
    this.selected = null;
  }

  create(patch: PatchModel) {
    this._patches[this.count++] = patch;
    patch.id = this.count - 1;
  }

  update(patch: PatchModel) {
    this._patches[patch.id] = patch;
    return this._patches[patch.id];
  }

  select(patch: PatchModel) {
    this.selected = patch;
  }

  isSelected(patch: PatchModel) {
    if (this.selected === null) {
      return false;
    } else if (patch === null) {
      return false;
    } else {
      return this.selected.id === patch.id;
    }
  }
}
