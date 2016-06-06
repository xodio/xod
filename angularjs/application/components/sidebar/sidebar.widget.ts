import { Component } from '@angular/core';
import {ControlPanelWidget} from './control-panel/control-panel.widget.ts';

@Component({
  selector: 'sidebar',
  template: require('./sidebar.widget.html'),
  styles: [require('./sidebar.widget.styl')],
  directives: [ControlPanelWidget]
})
export class SidebarWidget {
}
