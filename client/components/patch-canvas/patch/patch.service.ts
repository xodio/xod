import {Injectable} from '@angular/core';
import {PatchModel} from './patch.model.ts';
import {IServiceState} from '../../../share/interfaces.ts';

@Injectable()
export class PatchService {

  private _state: IServiceState;

  constructor() {
    this._state = {
      models: new Map<number, PatchModel>(),
      selected: null,
      count: 0
    };
  }

  patchesIds(): Array<number> {
    return this.patches().map(patch => patch.id);
  }

  patch(patchId: number) {
    return this.patches()[patchId];
  }

  patches() {
    const patches: Array<PatchModel> = [];
    const iterator = this._state.models.values();
    let value = iterator.next();
    while(!value.done) {
      patches.push(value.value);
      value = iterator.next();
    }
    return patches;
  }

  reserveId(): number {
    return this._state.count++;
  }

  create(patch: PatchModel) {
    this._state.models.set(patch.id, patch);
  }

  update(patch: PatchModel) {
    this._state.models.set(patch.id, patch);
    return patch;
  }

  select(patch: PatchModel) {
    this._state.selected = patch;
  }

  isSelected(patch: PatchModel) {
    if (this._state.selected === null) {
      return false;
    } else if (patch === null) {
      return false;
    } else {
      return this._state.selected.id === patch.id;
    }
  }

  resolve(patchId: number) {
    return this.patch(patchId);
  }
}
