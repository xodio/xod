import {OpaqueToken} from '@angular/core';

export let SAMPLE_NODE_CONFIG = new OpaqueToken('sample.node.config');

export interface SampleNodeConfigClass {
  nodesCount: number;
}

export const SampleNodeConfig: SampleNodeConfigClass =  {
  nodesCount: 20
};
