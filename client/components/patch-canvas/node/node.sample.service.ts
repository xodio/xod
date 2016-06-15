import {Injectable, Inject, forwardRef} from '@angular/core';
import {NodeModel} from "./node.model.ts";
import {NodeService} from "./node.service.ts";
import {Rect, Point} from '../geometry/geometry.lib.ts';
import {PatchService} from '../patch/patch.service.ts';
import {SAMPLE_NODE_CONFIG, SampleNodeConfigClass} from "./node.sample.config.ts";
import {SamplePatchService} from "../patch/patch.sample.service.ts";

@Injectable()
export class SampleNodeService extends NodeService {
  constructor(@Inject(forwardRef(() => SamplePatchService)) private patchService: SamplePatchService,
              @Inject(SAMPLE_NODE_CONFIG) private config: SampleNodeConfigClass) {
    super();
    console.log('sample node service');

    const patchesIds = patchService.patchesIds();

    for (let indexI = 0; indexI < patchesIds.length; ++indexI) {
      const patchId = patchesIds[indexI];

      for (let indexJ = 0; indexJ < this.config.nodesCount; ++indexJ) {
        const position = new Point(20 + indexJ * 360 % 1200, 20 + Math.floor(indexJ / 4) * 120);

        const node = new NodeModel(
          this.reserveId(), patchId, position, "Node", [], [], 0
        );

        this.create(node);
      }
    }
  }
}
