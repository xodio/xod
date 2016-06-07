import {Component, Input, Output, EventEmitter} from '@angular/core';
import {ControlPanelWidget} from './control-panel/control-panel.widget.ts';
import {PatchModel} from '../patch-canvas/patch/patch.model.ts';
import {EditorBus, EditorMessage} from '../editor/editor.bus.ts';

@Component({
  selector: 'sidebar',
  template: require('./sidebar.widget.html'),
  styles: [require('./sidebar.widget.styl')],
  directives: [ControlPanelWidget]
})
export class SidebarWidget {
  @Input() patch: PatchModel = null;
  @Output() patchChange = new EventEmitter<PatchModel>();

  constructor(private bus: EditorBus) {
    this.bus.listen('select-patch', (message: EditorMessage): void => {
      this.patch = <PatchModel>message.body;
    });
  }

  saveProperties() {
    this.patchChange.emit(this.patch);
  }

  onChange(event: any) {
    this.patch = this.patch.updateName(event.target.value);
    this.bus.send(new EditorMessage('update-patch', this.patch));
  }
}
