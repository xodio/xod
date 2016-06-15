import {Injectable, Inject, forwardRef} from '@angular/core';
import {PinService} from './pin.service.ts';
import {PatchService} from '../../patch/patch.service.ts';
import {NodeService} from '../node.service.ts';
import {PinModel, PinType} from './pin.model.ts';
import {SAMPLE_PIN_CONFIG, SamplePinConfigClass} from './pin.sample.config.ts';
import {SamplePatchService} from "../../patch/patch.sample.service.ts";
import {SampleNodeService} from "../node.sample.service.ts";

@Injectable()
export class SamplePinService extends PinService {
  constructor(
    @Inject(forwardRef(() => SamplePatchService)) private patchService: SamplePatchService,
    @Inject(forwardRef(() => SampleNodeService)) private nodeService: SampleNodeService,
    @Inject(SAMPLE_PIN_CONFIG) private config: SamplePinConfigClass
  ) {
    super();

    const patches = this.patchService.patchesIds();


    for (let indexI = 0; indexI < patches.length; ++indexI) {
      const nodesIds = this.nodeService.nodesIds(patches[indexI]);
      for (let indexJ = 0; indexJ < nodesIds.length; ++indexJ) {
        const nodeId = nodesIds[indexJ];
        let pin: PinModel = null;
        let indexK: number = null;
        for (indexK = 0; indexK < this.config.inputPinsCount; ++indexK) {
          pin = new PinModel(this.reserveId(), nodeId, indexK, "In", PinType.Input, this.nodeService.node(nodeId).position);
          this.createPin(pin);
        }
        
        for (indexK = 0; indexK < this.config.outputPinsCount; ++indexK) {
          pin = new PinModel(this.reserveId(), nodeId, indexK, "Out", PinType.Output, this.nodeService.node(nodeId).position);
          this.createPin(pin);
        }
      }
    }
  }
}
