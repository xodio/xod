
import { expect } from 'chai';
import transform from 'xod-espruino/transformer';

describe('Transformer', () => {
  it('should transform empty json to empty node list', () => {
    const nodes = transform({});
    expect(nodes).to.be.eql({});
  });

  it('should merge node and node type', () => {
    const nodes = transform({
      nodes: {
        42: {
          id: 42,
          typeId: 777,
        },
      },
      nodeTypes: {
        777: {
          id: 777,
          pure: true,
          setup: 'module.exports = function(fire) {};',
          evaluate: 'module.exports = function(inputs) { return {valueOut: valueIn + 100}; };',
          pins: {
            valueIn: {
              direction: 'input',
              key: 'valueIn',
              type: 'number',
            },
            valueOut: {
              direction: 'output',
              key: 'valueOut',
              type: 'number',
            },
          },
        },
      },
    });

    expect(nodes).to.be.eql({
      42: {
        id: 42,
        setup: 'module.exports = function(fire) {};',
        evaluate: 'module.exports = function(inputs) { return {valueOut: valueIn + 100}; };',
        pure: true,
        inputTypes: {
          valueIn: Number,
        },
        outLinks: {},
      },
    });
  });

  it('should merge links', () => {
    const nodes = transform({
      nodes: {
        42: { id: 42, typeId: 777 },
        43: { id: 43, typeId: 777 },
      },
      pins: {
        421: { id: 421, nodeId: 42, key: 'valueIn' },
        422: { id: 422, nodeId: 42, key: 'valueOut' },
        431: { id: 431, nodeId: 43, key: 'valueIn' },
        432: { id: 432, nodeId: 43, key: 'valueOut' },
      },
      links: {
        1: { id: 1, pins: [422, 431] },
      },
      nodeTypes: {
        777: {
          id: 777,
          pins: {
            valueIn: {
              direction: 'input',
              key: 'valueIn',
              type: 'number',
            },
            valueOut: {
              direction: 'output',
              key: 'valueOut',
              type: 'number',
            },
          },
        },
      },
    });

    expect(nodes[42].outLinks).to.be.eql({
      valueOut: [{
        nodeId: 43,
        key: 'valueIn',
      }],
    });
  });
});
