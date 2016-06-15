import {Injectable} from '@angular/core';
import {PatchModel} from './patch.model.ts';

@Injectable()
export class PatchService {
  private _patches: Map<number, PatchModel>;
  private selected: PatchModel;
  private count: number = 0;

  patchesIds(): Array<number> {
    return this.patches().map(patch => patch.id);
  }

  patch(patchId: number) {
    return this.patches()[patchId];
  }

  patches() {
    const patches: Array<PatchModel> = [];
    const iterator = this._patches.values();
    let value = iterator.next();
    while(!value.done) {
      patches.push(value.value);
      value = iterator.next();
    }
    return patches;
  }

  reserveId(): number {
    return this.count++;
  }

  constructor() {
    this._patches = new Map<number, PatchModel>();
    this.selected = null;
  }

  create(patch: PatchModel) {
    this._patches.set(patch.id, patch);
  }

  update(patch: PatchModel) {
    this._patches.set(patch.id, patch);
    return patch;
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
