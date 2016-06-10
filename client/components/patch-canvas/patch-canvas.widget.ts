import {Component, ElementRef, EventEmitter, Input, Output, Inject, provide} from '@angular/core';
import {PatchService} from './patch/patch.service.ts';
import {PatchComponent} from "./patch/patch.component.ts";
import {PatchModel} from './patch/patch.model.ts';
import {Rect, Point} from "./geometry/geometry.lib.ts";
import {SamplePatchService} from './patch/patch.sample.service.ts';
import {EditorBus, EditorMessage} from "../editor/editor.bus.ts";
import {NodeService} from "./node/node.service.ts";
import {SampleNodeService} from "./node/node.sample.service.ts";
import {SamplePinService} from "./node/pin/pin.sample.service.ts";
import {PinService} from "./node/pin/pin.service.ts";


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
  providers: [
    provide(NodeService, {
      useExisting: SampleNodeService
    }),
    provide(PatchService, {
      useExisting: SamplePatchService
    })
  ]
})
export class PatchCanvasWidget {
  private patches: Array<number>;

  constructor(private element: ElementRef, private service: PatchService, private bus: EditorBus) {
    bus.listen('create-patch', (message: EditorMessage): void => {
      this.patches = this.service.patchesAsArray();
    });
  }

  ngOnInit() {
    this.patches = this.service.patchesAsArray();
  }

  addPatch(event: any) {
    const topLeftPoint = new Point(event.offsetX, event.offsetY);
    const bottomRightPoint = new Point(topLeftPoint.x + 100, topLeftPoint.y + 100);
    this.patches = this.service.patchesIds();
  }
}
