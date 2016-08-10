
import { expect } from 'chai';
import transform from 'xod-espruino/transformer';

describe('Transformer', () => {
  it('should transform empty json to empty result', () => {
    const result = transform({});
    expect(result.nodes).to.be.eql({});
    expect(result.impl).to.be.eql({});
  });

  it('should merge node and node type', () => {
    const impl =
      'module.exports.evaluate = ' +
      'function(e) { return {valueOut: e.inputs.valueIn + 100}; };';

    const result = transform({
      patches: {
        1: {
          id: 1,
          nodes: {
            42: {
              id: 42,
              typeId: 777,
            },
          },
        },
      },
      nodeTypes: {
        777: {
          id: 777,
          pure: true,
          impl,
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

    expect(result.nodes).to.be.eql({
      42: {
        id: 42,
        implId: 777,
        pure: true,
        inputTypes: {
          valueIn: Number,
        },
        outLinks: {},
      },
    });

    expect(result.impl).to.be.eql({ 777: impl });
  });

  it('should merge links', () => {
    const result = transform({
      patches: {
        1: {
          id: 1,
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
        },
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

    expect(result.nodes[42].outLinks).to.be.eql({
      valueOut: [{
        nodeId: 43,
        key: 'valueIn',
      }],
    });
  });

  it('should merge patches', () => {
    const result = transform({
      patches: {
        1: {
          id: 1,
          nodes: {
            42: { id: 42, typeId: 777 },
          },
        },
        2: {
          id: 2,
          nodes: {
            43: { id: 43, typeId: 777 },
          },
        },
      },
      nodeTypes: {
        777: {
          id: 777,
          pins: {},
        },
      },
    });

    expect(result.nodes).to.have.property(42);
    expect(result.nodes).to.have.property(43);
  });
});
