import {Injectable} from '@angular/core';
import {PatchSample} from './patch.sample.ts';
import {PatchModel} from './patch.model.ts';

@Injectable()
export class PatchService {
  private sample: PatchModel;

  constructor() {
    this.sample = new PatchSample();
  }

  getPatch(id: string) {
    return this.sample;
  }
}
