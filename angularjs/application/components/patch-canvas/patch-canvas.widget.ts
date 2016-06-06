import {Component} from '@angular/core';
import {PatchService} from './patch/patch.service.ts';
import {PatchComponent} from "./patch/patch.component.ts";
import {PatchModel} from './patch/patch.model.ts';

@Component({
  selector: 'patch-canvas',
  template: require('./patch-canvas.widget.html'),
  styles: [require('./patch-canvas.widget.styl')],
  directives: [PatchComponent],
  providers: [PatchService]
})
export class PatchCanvasWidget {
  private patch: PatchModel;

  constructor(private service: PatchService) {
    this.patch = service.getPatch("");
  }
}
