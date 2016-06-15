import { Injectable } from '@angular/core';
import { NodeTypeService } from './node-type.service.ts';
import { INodeType, NodeCategory } from './node-type.interface.ts';

@Injectable()
export class SampleNodeTypeService extends NodeTypeService {

    constructor() {
        super();

        this.addFromArray([
          {
            id: 1,
            label: 'not',
            category: NodeCategory.Functional
          },
          {
            id: 2,
            label: 'equal',
            category: NodeCategory.Functional
          },
          {
            id: 3,
            label: 'either',
            category: NodeCategory.Functional
          },
          {
            id: 4,
            label: 'button',
            category: NodeCategory.Hardware
          },
          {
            id: 5,
            label: 'thermometer',
            category: NodeCategory.Hardware
          },
          {
            id: 6,
            label: 'configuration',
            category: NodeCategory.Configuration
          },
          {
            id: 7,
            label: 'led',
            category: NodeCategory.Watch
          },
          {
            id: 8,
            label: 'someUserPatch',
            category: NodeCategory.Patch
          }
        ]);
    }
}