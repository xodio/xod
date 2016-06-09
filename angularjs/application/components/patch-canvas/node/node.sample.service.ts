import {Injectable, Inject, forwardRef} from '@angular/core';
import {NodeModel} from "./node.model.ts";
import {NodeService} from "./node.service.ts";
import {Rect, Point} from '../geometry/geometry.lib.ts';
import {PatchService} from '../patch/patch.service.ts';
import {SampleNodeConfig} from "./node.sample.config.ts";

@Injectable()
export class SampleNodeService extends NodeService {
  constructor(@Inject(forwardRef(() => PatchService)) private patchService: PatchService,
              @Inject(forwardRef(() => NodeService)) private nodeService: NodeService,
              @Inject(SampleNodeConfig.defaultConfig) private config: SampleNodeConfig) {
    super();

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

        this.nodeService.create(node);
      }
    }
  }
}