import {OpaqueToken} from '@angular/core';

export let SamplePinConfigToken = new OpaqueToken('node.sample.config');

export class SamplePinConfig {
  constructor(public inputPinsCount: number, public outputPinsCount: number) {
  }

  static defaultConfig = new SamplePinConfig(10, 4);
}
