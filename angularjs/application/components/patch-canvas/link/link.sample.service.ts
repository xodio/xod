import {Injectable} from '@angular/core';
import {LinkService} from './link.service.ts';
import {PatchService} from "../patch/patch.service.ts";
import {NodeService} from "../node/node.service.ts";
import {PinService} from "../node/pin/pin.service.ts";

export class SampleLinkService extends LinkService {
  constructor(private patchService: PatchService, private nodeService: NodeService, private pinService: PinService, private linksCount: number) {
    super();
  }
}