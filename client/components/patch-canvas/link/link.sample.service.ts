import {Injectable, Inject, forwardRef} from '@angular/core';
import {LinkService} from './link.service.ts';
import {PatchService} from "../patch/patch.service.ts";
import {NodeService} from "../node/node.service.ts";
import {PinService} from "../node/pin/pin.service.ts";
import {EditorBus} from "../../editor/editor.bus.ts";

@Injectable()
export class SampleLinkService extends LinkService {
  constructor(@Inject(forwardRef(() => PatchService)) private patchService: PatchService,
              @Inject(forwardRef(() => NodeService)) private nodeService: NodeService,
              @Inject(forwardRef(() => PinService)) private pinService: PinService) {
    super();
  }
}
