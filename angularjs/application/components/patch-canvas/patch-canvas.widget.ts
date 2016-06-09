import {Component, ElementRef, EventEmitter, Input, Output} from '@angular/core';
import {PatchService} from './patch/patch.service.ts';
import {PatchComponent} from "./patch/patch.component.ts";
import {PatchModel} from './patch/patch.model.ts';
import {Rect, Point} from "./geometry/geometry.lib.ts";
import {SamplePatchService} from './patch/patch.sample.service.ts';
import {NodeService} from './node/node.service.ts';
import {LinkService} from './link/link.service.ts';
import {PinService} from './node/pin/pin.service.ts';
import {SamplePinService} from './node/pin/pin.sample.service.ts';
import {SampleNodeService} from './node/node.sample.service.ts';
import {SampleLinkService} from './link/link.sample.service.ts';


/**
 * @component
 * @purpose Working with patches
 * @emits select
 */
@Component({
  selector: 'patch-canvas',
  template: require('./patch-canvas.widget.html'),
  styles: [require('./patch-canvas.widget.styl')],
  directives: [PatchComponent],
  providers: [[
    PatchService, {
      useExisting: SamplePatchService
    }], [
    NodeService, {
      useExisting: SampleNodeService,
      deps: []
    }], [
    LinkService, {
      useExisting: SampleLinkService
    }], [
    PinService, {
      useExisting: SamplePinService,
      deps: [
        SamplePatchService, SampleNodeService, {
          inputPinsCount: 10,
          outputPinsCount: 5
        }
      ]
    }]]
})
export class PatchCanvasWidget {
  private patches: Array<PatchModel>;

  constructor(private element: ElementRef, private service: PatchService) {
    this.patches = this.service.patchesAsArray();
  }

  addPatch(event: any) {
    const topLeftPoint = new Point(event.offsetX, event.offsetY);
    const bottomRightPoint = new Point(topLeftPoint.x + 100, topLeftPoint.y + 100);
    this.service.create(new PatchModel(10, 'New', new Rect(topLeftPoint, bottomRightPoint), [], []));
    this.patches = this.service.patchesIds();
  }
}
