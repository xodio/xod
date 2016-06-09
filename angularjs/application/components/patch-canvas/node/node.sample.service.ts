import {Injectable} from '@angular/core';
import {NodeModel} from "./node.model.ts";
import {NodeService} from "./node.service.ts";
import {Rect, Point} from '../geometry/geometry.lib.ts';
import {PatchService} from '../patch/patch.service.ts';

@Injectable()
export class SampleNodeService extends NodeService {
  constructor(private patchService: PatchService,
              private nodeService: NodeService,
              private nodesCount: number) {
    super();

    const patchesIds = this.patchService.patchesIds();

    for (let indexI in Object.keys(patchesIds)) {
      for (let indexJ = 0; indexJ < this.nodesCount; ++indexJ) {
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