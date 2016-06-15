import { Injectable } from '@angular/core';
import { NodeTypeService } from './node-type.service.ts';
import { INodeType } from './node-type.interface.ts';

@Injectable()
export class SampleNodeTypeService extends NodeTypeService {

    constructor() {
        super();

        this.addFromArray([
          {
            id: 0,
            label: 'not',
            category: 0
          },
          {
            id: 1,
            label: 'equal',
            category: 0
          },
          {
            id: 2,
            label: 'either',
            category: 0
          },
          {
            id: 3,
            label: 'button',
            category: 1
          },
          {
            id: 4,
            label: 'thermometer',
            category: 1
          },
          {
            id: 5,
            label: 'configuration',
            category: 2
          },
          {
            id: 6,
            label: 'led',
            category: 3
          }
        ]);
    }
}