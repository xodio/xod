import {Injectable} from '@angular/core';
import {PinService} from './pin.service.ts';
import {PatchService} from '../../patch/patch.service.ts';
import {NodeService} from '../node.service.ts';
import {PinModel, PinType} from './pin.model.ts';

@Injectable()
export class SamplePinService extends PinService {
  constructor(private patchService: PatchService, private nodeService: NodeService, private inputPinsCount: number, private outputPinsCount: number) {
    super();

    const patches = this.patchService.patchesAsArray();

    for (let indexI = 0; indexI < patches.length; ++indexI) {
      const nodesIds = this.nodeService.nodesIds(patches[indexI]);
      for (let indexJ = 0; indexJ < nodesIds.length; ++indexJ) {
        const nodeId = nodesIds[indexJ];
        let pin: PinModel = null;
        let indexK: number = null;
        for (indexK = 0; indexK < this.inputPinsCount; ++indexK) {
          pin = new PinModel(null, nodeId, indexK, "In", PinType.Input);
          this.createPin(pin);
        }

        for (indexK = 0; indexK < this.outputPinsCount; ++indexK) {
          pin = new PinModel(null, nodeId, indexK, "Out", PinType.Output);
          this.createPin(pin);
        }
      }
    }
  }
}
