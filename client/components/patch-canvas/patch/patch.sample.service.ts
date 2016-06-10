import {PatchModel} from './patch.model.ts';
import {NodeModel} from '../node/node.model.ts';
import {Rect, Point} from '../geometry/geometry.lib.ts';
import {PatchService} from "./patch.service.ts";
import {Injectable} from '@angular/core';
import {EditorBus, EditorMessage} from "../../editor/editor.bus.ts";

@Injectable()
export class SamplePatchService extends PatchService {
  constructor(private bus: EditorBus, private patchService: PatchService) {
    super();
    const samplePatch = new PatchModel(this.patchService.reserveId(), "Sample patch", new Rect(new Point(0, 0), new Point(2000, 2000)), [], []);
    this.create(samplePatch);
    this.bus.send(new EditorMessage('create-patch', {}));
  }
}
