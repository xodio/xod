import {OpaqueToken} from '@angular/core';

export let SAMPLE_PATCH_CONFIG = new OpaqueToken('sample.patch.config');

export interface SamplePatchConfigClass {
  patchesCount: number;
}

export const SamplePatchConfig: SamplePatchConfigClass =  {
  patchesCount: 1
};
