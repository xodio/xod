import {Component, Input, EventEmitter, Output} from '@angular/core';
import {PatchCanvasWidget} from '../patch-canvas/patch-canvas.widget.ts';
import {SidebarWidget} from '../sidebar/sidebar.widget.ts';
import {PatchModel} from '../patch-canvas/patch/patch.model.ts';

@Component({
  selector: 'editor',
  template: require('./editor.page.html'),
  styles: [require('./editor.page.styl')],
  directives: [SidebarWidget, PatchCanvasWidget]
})
export class EditorPage {
  @Input() selectedPatch: PatchModel = null;
  @Output() selectedPatchChange = new EventEmitter<PatchModel>();

  constructor() {
  }
}
