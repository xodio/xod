import { bootstrap }    from '@angular/platform-browser-dynamic';
import './shim.ts';
import { AppComponent } from './app.ts';
import {EditorBus} from "./components/editor/editor.bus.ts";
import {PatchService} from "./components/patch-canvas/patch/patch.service.ts";
import {PinService} from "./components/patch-canvas/node/pin/pin.service.ts";
import {NodeService} from "./components/patch-canvas/node/node.service.ts";

bootstrap(AppComponent);
