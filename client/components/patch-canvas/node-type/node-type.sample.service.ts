import { Injectable } from '@angular/core';
import { NodeTypeService } from './node-type.service.ts';
import { INodeType } from './node-type.interface.ts';

@Injectable()
export class SampleNodeTypeService extends NodeTypeService {

    constructor() {
        super();

        this.addFromArray([
          {
            id: 1,
            label: 'not',
            category: 1
          },
          {
            id: 2,
            label: 'equal',
            category: 1
          },
          {
            id: 3,
            label: 'either',
            category: 1
          },
          {
            id: 4,
            label: 'button',
            category: 2
          },
          {
            id: 5,
            label: 'thermometer',
            category: 2
          },
          {
            id: 6,
            label: 'configuration',
            category: 3
          },
          {
            id: 7,
            label: 'led',
            category: 4
          },
          {
            id: 8,
            label: 'someUserPatch',
            category: 5
          }
        ]);
    }
}