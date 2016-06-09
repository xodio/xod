import {Injectable, Inject, forwardRef} from '@angular/core';
import {NodeModel} from "./node.model.ts";
import {NodeService} from "./node.service.ts";
import {Rect, Point} from '../geometry/geometry.lib.ts';
import {PatchService} from '../patch/patch.service.ts';
import {SAMPLE_NODE_CONFIG, SampleNodeConfigClass} from "./node.sample.config.ts";

@Injectable()
export class SampleNodeService extends NodeService {
  constructor(@Inject(forwardRef(() => PatchService)) private patchService: PatchService,
              @Inject(SAMPLE_NODE_CONFIG) private config: SampleNodeConfigClass) {
    super();
    console.log('sample node service');

    const patchesIds = this.patchService.patchesIds();

    for (let indexI in Object.keys(patchesIds)) {
      for (let indexJ = 0; indexJ < this.config.nodesCount; ++indexJ) {
        const patchId = patchesIds[indexI];
        const patchBBox = new Rect(
          new Point(20 + indexJ * 120 % 700, 20 + indexJ * 120 % 700),
          new Point(20 + indexJ * 120 % 700, 20 + indexJ * 120 % 700)
        );

        const node = new NodeModel(
          null, patchId, patchBBox, "Node", [], []
        );

        this.create(node);
      }
    }
  }
}