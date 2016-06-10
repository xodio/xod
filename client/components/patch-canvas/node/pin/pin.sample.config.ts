import {OpaqueToken} from '@angular/core';

export let SAMPLE_PIN_CONFIG = new OpaqueToken('sample.pin.config');

export interface SamplePinConfigClass {
  inputPinsCount: number;
  outputPinsCount: number;
}

export const SamplePinConfig: SamplePinConfigClass =  {
  inputPinsCount: 10,
  outputPinsCount: 5
};
