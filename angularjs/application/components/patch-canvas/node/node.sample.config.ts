import {OpaqueToken} from '@angular/core';

export let SampleNodeConfigToken = new OpaqueToken('node.sample.config');

export class SampleNodeConfig {
  constructor(public nodesCount: number) {
  }

  static defaultConfig: SampleNodeConfig = new SampleNodeConfig(10);
}
