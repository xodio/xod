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

    console.log(patchesIds);

    for (let indexI in Object.keys(patchesIds)) {
      for (let indexJ = 0; indexJ < this.config.nodesCount; ++indexJ) {
        const patchId = patchesIds[indexI];
        const patchBBox = new Rect(
          new Point(20 + indexJ * 360 % 1200, 20 + Math.floor(indexJ / 4) * 120),
          new Point(20 + indexJ * 360 % 1200 + 120, 20 + Math.floor(indexJ / 4) * 120 + 120)
        );

        const node = new NodeModel(
          this.reserveId(), patchId, patchBBox, "Node", [], []
        );

        this.create(node);
      }
    }
  }
}
