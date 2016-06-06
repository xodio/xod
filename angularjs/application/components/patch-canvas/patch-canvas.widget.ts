import {Component, ElementRef} from '@angular/core';
import {PatchService} from './patch/patch.service.ts';
import {PatchComponent} from "./patch/patch.component.ts";
import {PatchModel} from './patch/patch.model.ts';

@Component({
  selector: 'patch-canvas',
  template: require('./patch-canvas.widget.html'),
  styles: [require('./patch-canvas.widget.styl')],
  directives: [PatchComponent],
})
export class PatchCanvasWidget {
  private patches: Array<PatchModel>;

  constructor(private service: PatchService) {
    this.patches = service.patchesAsArray();
  }
}
