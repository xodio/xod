
import { expect } from 'chai';
import transform from '../../src/runtime/xod-espruino/transformer';

describe('Transformer', () => {
  it('should transform empty json to empty result', () => {
    const result = transform({});
    expect(result.nodes).to.be.eql({});
    expect(result.impl).to.be.eql({});
  });

  it('should merge node and node type', () => {
    const result = transform({
      patches: {
        1: {
          id: 1,
          nodes: {
            42: {
              id: 42,
              typeId: 'core/add100',
              properties: { someValue: 'foo' },
            },
          },
        },
      },
      nodeTypes: {
        'core/add100': {
          key: 'core/add100',
          pure: true,
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
        implId: 'core/add100',
        pure: true,
        inputTypes: {
          valueIn: Number,
        },
        outLinks: {},
        props: { someValue: 'foo' },
      },
    });
  });

  it('should extract implementation', () => {
    const js = 'module.exports.setup = function() {}';
    const cpp = 'void setup(void*) {}';

    const result = transform({
      patches: {
        1: {
          id: 1,
          nodes: {
            42: { id: 42, typeId: 'core/add100' },
          },
        },
      },
      nodeTypes: {
        'core/add100': {
          id: 'core/add100',
          impl: { js, cpp },
        },
      },
    }, ['es6', 'js']);

    expect(result.impl).to.be.eql({ 'core/add100': js });
  });

  it('should merge links', () => {
    const result = transform({
      patches: {
        1: {
          id: 1,
          nodes: {
            42: { id: 42, typeId: 'core/add100' },
            43: { id: 43, typeId: 'core/add100' },
          },
          links: {
            1: {
              id: 1,
              pins: [
                { nodeId: 42, pinKey: 'valueOut' },
                { nodeId: 43, pinKey: 'valueIn' },
              ],
            },
          },
        },
      },
      nodeTypes: {
        'core/add100': {
          id: 'core/add100',
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
            42: { id: 42, typeId: 'core/add100' },
          },
        },
        2: {
          id: 2,
          nodes: {
            43: { id: 43, typeId: 'core/add100' },
          },
        },
      },
      nodeTypes: {
        'core/add100': {
          id: 'core/add100',
          pins: {},
        },
      },
    });

    expect(result.nodes).to.have.property(42);
    expect(result.nodes).to.have.property(43);
  });

  it('should sort nodes', () => {
    const result = transform({
      patches: {
        1: {
          id: 1,
          nodes: {
            42: { id: 42, typeId: 'core/add100' },
            43: { id: 43, typeId: 'core/add100' },
          },
          links: {
            1: {
              id: 1,
              pins: [
                { nodeId: 42, pinKey: 'valueOut' },
                { nodeId: 43, pinKey: 'valueIn' },
              ],
            },
          },
        },
      },
      nodeTypes: {
        'core/add100': {
          id: 'core/add100',
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

    expect(result.topology).to.be.eql([42, 43]);
  });
});
