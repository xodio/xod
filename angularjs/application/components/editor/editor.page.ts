import {Component} from '@angular/core';
import {PatchCanvasWidget} from '../patch-canvas/patch-canvas.widget.ts';
import {SidebarWidget} from '../sidebar/sidebar.widget.ts';

@Component({
  selector: 'editor',
  template: require('./editor.page.html'),
  styles: [require('./editor.page.styl')],
  directives: [SidebarWidget, PatchCanvasWidget]
})
export class EditorPage {
}
