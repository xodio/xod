import {PatchModel} from './patch.model.ts';
import {NodeModel} from '../node/node.model.ts';
import {Rect, Point} from '../geometry/geometry.lib.ts';
import {PatchService} from "./patch.service.ts";
import {Injectable} from '@angular/core';

@Injectable()
export class SamplePatchService extends PatchService{
  constructor() {
    super();
    const samplePatch = new PatchModel(null, "Sample patch", new Rect(new Point(0, 0), new Point(2000, 2000)), [], []);
    this.create(samplePatch);
  }
}
