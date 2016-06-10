import { bootstrap }    from '@angular/platform-browser-dynamic';
import './shim.ts';
import { AppComponent } from './app.ts';
import {PatchService} from './components/patch-canvas/patch/patch.service.ts';
import {EditorBus} from "./components/editor/editor.bus.ts";

bootstrap(AppComponent, [PatchService, EditorBus]);
