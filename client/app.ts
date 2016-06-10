import {Component, provide} from '@angular/core';
import {EditorPage} from './components/editor/editor.page.ts';
import {SampleNodeService} from "./components/patch-canvas/node/node.sample.service.ts";
import {NodeService} from './components/patch-canvas/node/node.service.ts';
import {PatchService} from './components/patch-canvas/patch/patch.service.ts';
import {SamplePinService} from "./components/patch-canvas/node/pin/pin.sample.service.ts";
import {SampleLinkService} from './components/patch-canvas/link/link.sample.service.ts';
import {SamplePatchService} from './components/patch-canvas/patch/patch.sample.service.ts';
import {SampleNodeConfig, SAMPLE_NODE_CONFIG} from "./components/patch-canvas/node/node.sample.config.ts";
import {PinService} from "./components/patch-canvas/node/pin/pin.service.ts";
import {SAMPLE_LINK_CONFIG, SampleLinkConfig} from "./components/patch-canvas/link/link.sample.config.ts";
import {SamplePinConfig, SAMPLE_PIN_CONFIG} from "./components/patch-canvas/node/pin/pin.sample.config.ts";
import {SAMPLE_PATCH_CONFIG, SamplePatchConfig} from "./components/patch-canvas/patch/patch.sample.config.ts";
import {EditorBus} from "./components/editor/editor.bus.ts";

@Component({
    selector: 'xod',
    template: '<editor></editor>',
    directives: [EditorPage],
    styles: [require('./app.styl')],
    providers: [
      provide(SAMPLE_NODE_CONFIG, {useValue: SampleNodeConfig}),
      provide(SAMPLE_PATCH_CONFIG, {useValue: SamplePatchConfig}),
      provide(SAMPLE_LINK_CONFIG, {useValue: SampleLinkConfig}),
      provide(SAMPLE_LINK_CONFIG, {useValue: SampleLinkConfig}),
      provide(SampleNodeService, {
          deps: [
            provide(SAMPLE_NODE_CONFIG, {
              useValue: SampleNodeConfig
            }),
            provide(PatchService, {
              useExisting: SamplePatchService
            }),
            EditorBus
          ]}
      ),
      provide(SampleNodeConfig, {
        deps: [
          provide(SAMPLE_NODE_CONFIG, {
            useValue: SampleNodeConfig
          }),
          provide(NodeService, {
            useExisting: SampleNodeConfig
          }),
          EditorBus
        ]
      }),
      provide(SamplePinService, {
          deps: [
            provide(SAMPLE_PIN_CONFIG, {
              useValue: SamplePinConfig
            }),
            provide(NodeService, {
              useExisting: SampleNodeService
            }),
            EditorBus
          ]
      }),
      provide(SampleLinkService, {
        deps: [
          provide(SAMPLE_LINK_CONFIG, {
            useValue: SampleLinkConfig
          }),
          provide(PinService, {
            useExisting: SamplePinService
          }),
          EditorBus
        ]
      }),
      SamplePatchService
    ]
})
export class AppComponent {
}
