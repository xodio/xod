import {Injectable} from '@angular/core';
import {PatchSample} from './patch.sample.ts';
import {PatchModel} from './patch.model.ts';

@Injectable()
export class PatchService {
  private patches: Map<string, PatchModel>;
  private selected: PatchModel;

  constructor() {
    this.patches = new Map<string, PatchModel>();
    this.patches["a"] = new PatchSample("A");
    this.patches["b"] = new PatchSample("B");
    this.selected = null;
  }

  patchesAsArray(): Array<PatchModel> {
    return Object.keys(this.patches).map(name => this.patches[name]);
  }

  patch(name: string) {
    return this.patches[name];
  }

  update(patch: PatchModel) {
    this.patches[patch.name] = patch;
    return this.patches[name];
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
      return this.selected.name === patch.name;
    }
  }
}
