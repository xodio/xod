import {Injectable} from '@angular/core';
import {PatchModel} from './patch.model.ts';

@Injectable()
export class PatchService {
  private _patches: Map<number, PatchModel>;
  private selected: PatchModel;
  private count: number = 0;

  patchesAsArray() {
    return Object.keys(this._patches).map(key => this._patches[key]);
  }

  patch(patchId: number) {
    return this.patches()[patchId];
  }

  patches() {
    return this._patches;
  }

  patchesIds() {
    return this.patchesAsArray().map(patch => patch.id);
  }

  constructor() {
    this._patches = new Map<number, PatchModel>();
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

  resolve(patchId: number) {
    return this.patch(patchId);
  }
}
