import {OpaqueToken} from '@angular/core';

export let SAMPLE_LINK_CONFIG = new OpaqueToken('sample.link.config');

export interface SampleLinkConfigClass {
  linksCount: number;
}

export const SampleLinkConfig: SampleLinkConfigClass =  {
  linksCount: 0
};
