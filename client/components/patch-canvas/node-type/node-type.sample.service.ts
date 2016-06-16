import { Injectable } from '@angular/core';
import { NodeTypeService } from './node-type.service.ts';
import { INodeType, NodeCategory, PinType } from './node-type.interface.ts';

@Injectable()
export class SampleNodeTypeService extends NodeTypeService {

    constructor() {
        super();

        this.addFromArray([
          {
            id: 1,
            label: 'not',
            category: NodeCategory.Functional,
            inputs: [ {
              name: 'in',
              type: PinType.Bool,
              description: 'Value to be inverted'
            } ],
            outputs: [ {
              name: 'out',
              type: PinType.Bool,
              description: 'Resulting inverted value',
            } ]
          },
          {
            id: 2,
            label: 'either',
            category: NodeCategory.Functional,
            inputs: [{
              name: 'in',
              label: 'IN',
              type: PinType.Bool,
              description: 'Selector value'
            }, {
              name: 'ifTrue',
              label: 'T',
              type: PinType.String,
              description: 'Output if selector is true'
            }, {
              name: 'ifFalse',
              label: 'F',
              type: PinType.String,
              description: 'Output if selector is false'
            }],
            outputs: [{
              name: 'out',
              type: PinType.String,
              description: 'Selected output value'
            }]
          },
          {
            id: 3,
            label: 'switch',
            category: NodeCategory.Hardware,
            inputs: [],
            outputs: [{
              name: 'state',
              label: 'ST',
              type: PinType.Bool,
              description: 'Current switch state: false in default position, true in opposite'
            }, {
              name: 'press',
              label: 'P',
              type: PinType.Event,
              description: 'Occurs in a moment when the switch is shifted'
            }, {
              name: 'release',
              label: 'R',
              type: PinType.Event,
              description: 'Occurs in a moment when the switch is released'
            }]
          },
          {
            id: 4,
            label: 'servo',
            category: NodeCategory.Hardware,
            inputs: [{
              name: 'enable',
              label: 'EN',
              type: PinType.Bool,
              defaultValue: true,
              description: 'Apply torque to the shaft'
            }, {
              name: 'value',
              label: 'VAL',
              type: PinType.Number,
              defaultValue: 1,
              description: 'Rotation angle/value'
            }],
            outputs: []
          },
          {
            id: 5,
            label: 'pot',
            category: NodeCategory.Hardware,
            inputs: [],
            outputs: [{
              name: 'value',
              type: PinType.Number,
              description: 'Current potentiometer value',
            }]
          },
          {
            id: 6,
            label: 'configuration',
            category: NodeCategory.Configuration,
            inputs: [],
            outputs: [{
              name: 'value',
              type: PinType.Any
            }]
          },
          {
            id: 7,
            label: 'led',
            category: NodeCategory.Watch,
            inputs: [{
              name: 'enable',
              label: 'EN',
              type: PinType.Bool,
              defaultValue: true,
              description: 'Set to true to power the LED'
            }, {
              name: 'brightness',
              label: 'BR',
              type: PinType.Number,
              defaultValue: 1,
              description: 'Shine brightness'
            }],
            outputs: []
          },
          {
            id: 8,
            label: 'UserPatch #0',
            category: NodeCategory.Patch,
            inputs: [],
            outputs: []
          },
          {
            id: 9,
            label: 'map',
            category: NodeCategory.Functional,
            inputs: [{
              name: 'in',
              label: 'IN',
              type: PinType.Number,
              description: 'Input value to map'
            }, {
              name: 'inA',
              label: 'As',
              type: PinType.Number,
              description: 'Input range start'
            }, {
              name: 'inB',
              label: 'Bs',
              type: PinType.Number,
              description: 'Input range end'
            }, {
              name: 'outA',
              label: 'At',
              type: PinType.Number,
              description: 'Output range start'
            }, {
              name: 'outB',
              label: 'Bt',
              type: PinType.Number,
              description: 'Output range end'
            }, {
              name: 'clip',
              label: 'CL',
              type: PinType.Bool,
              description: 'Clip result to output range'
            }],
            outputs: [{
              name: 'out',
              type: PinType.Number,
              description: 'Mapped value',
            }]
          },
          {
            id: 10,
            label: 'flip-flop',
            category: NodeCategory.Functional,
            inputs: [{
              name: 'toggle',
              label: 'TGL',
              type: PinType.Trigger,
              description: 'Flip current state to opposite'
            }, {
              name: 'set',
              label: 'SET',
              type: PinType.Trigger,
              description: 'Set current state to true'
            }, {
              name: 'reset',
              label: 'RST',
              type: PinType.Trigger,
              description: 'Set current state to false'
            }],
            outputs: [{
              name: 'state',
              type: PinType.Bool,
              description: 'Current latch state',
            }]
          },
        ]);

    }
}