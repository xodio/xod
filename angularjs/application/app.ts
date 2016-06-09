import {Component, provide} from '@angular/core';
import {EditorPage} from './components/editor/editor.page.ts';
import {SampleNodeService} from "./components/patch-canvas/node/node.sample.service.ts";
import {NodeService} from './components/patch-canvas/node/node.service.ts';
import {PatchService} from './components/patch-canvas/patch/patch.service.ts';
import {SamplePinService} from "./components/patch-canvas/node/pin/pin.sample.service.ts";
import {SampleLinkService} from './components/patch-canvas/link/link.sample.service.ts';

@Component({
    selector: 'xod',
    template: '<editor></editor>',
    directives: [EditorPage],
    styles: [require('./app.styl')],
    providers: [
      provide(SampleNodeService, {
          deps: [NodeService, PatchService]
        }
      ),
      provide(SamplePinService, {
          deps: [PatchService, NodeService]
      }),
      provide(SampleLinkService, {
          deps: []
      })
    ]
})
export class AppComponent {
}
