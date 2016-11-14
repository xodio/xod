
import R from 'ramda';
import { assert, expect } from 'chai';
import transform from '../src/transformer';

const ioTypes = {
  'xod/core/inputBool': {
    key: 'xod/core/inputBool',
    pins: { PIN: { direction: 'output', key: 'PIN', type: 'bool' } },
  },
  'xod/core/outputBool': {
    key: 'xod/core/outputBool',
    pins: { PIN: { direction: 'input', key: 'PIN', type: 'bool' } },
  },
};

const buttonAndLedTypes = {
  button: {
    key: 'button',
    pins: {
      state: {
        direction: 'output',
        key: 'state',
        type: 'bool',
      },
    },
  },
  led: {
    key: 'led',
    pins: {
      brightness: {
        direction: 'input',
        key: 'brightness',
        type: 'number',
      },
    },
  },
};

const hasLink = (result, [nodeFrom, pinFrom, pinTo, nodeTo]) => R.equals(
  result.nodes[nodeFrom.toString()].outLinks,
  { [pinFrom]: [{ key: pinTo, nodeId: nodeTo }] }
);

const hasTopology = result => R.equals(
  R.map(id => [id, result.nodes[id].implId], result.topology)
);

const link = (id, [nodeFrom, pinFrom, pinTo, nodeTo]) => ({
  id,
  pins: [
    { nodeId: nodeFrom, pinKey: pinFrom },
    { nodeId: nodeTo, pinKey: pinTo },
  ],
});


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
      0: {
        id: 0,
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
            1: link(1, [42, 'valueOut', 'valueIn', 43]),
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

    const [nid1, nid2] = result.topology;
    expect(result.nodes[nid1].outLinks).to.be.eql({
      valueOut: [{
        nodeId: nid2,
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

    const [nid1, nid2] = result.topology;

    expect(result.nodes).to.have.property(nid1);
    expect(result.nodes).to.have.property(nid2);
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
            1: link(1, [42, 'valueOut', 'valueIn', 43]),
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

    expect(result.topology).to.be.eql([0, 1]);
  });

  it('should inject patchnode with input only', () => {
    const result = transform({
      patches: {
        1: {
          id: 1,
          nodes: {
            101: { id: 101, typeId: 'foo/NOP' },
          },
          links: {},
        },
        2: {
          id: 2,
          label: 'NOP',
          nodes: {
            42: { id: 42, typeId: 'xod/core/inputPulse' },
          },
        },
      },
    });

    const [newId] = result.topology;

    expect(
      result.nodes[newId]
    ).to.be.eql({
      id: newId,
      inputTypes: {},
      outLinks: {},
      implId: 'xod/core/inputPulse',
    });
  });

  it('should inject patchnode with output only', () => {
    const result = transform({
      patches: {
        1: {
          id: 1,
          nodes: {
            101: { id: 101, typeId: 'foo/NOP' },
          },
          links: {},
        },
        2: {
          id: 2,
          label: 'NOP',
          nodes: {
            42: { id: 42, typeId: 'xod/core/outputPulse' },
          },
        },
      },
    });

    const [newId] = result.topology;

    expect(
      result.nodes[newId]
    ).to.be.eql({
      id: newId,
      inputTypes: {},
      outLinks: {},
      implId: 'xod/core/outputPulse',
    });
  });

  it('injected input should be connected properly', () => {
    const result = transform({
      patches: {
        1: {
          id: 1,
          nodes: {
            100: { id: 100, typeId: 'button' },
            101: { id: 101, typeId: 'foo/BULB' },
          },
          links: {
            1: link(1, [100, 'state', '41', 101]),
          },
        },
        2: {
          id: 2,
          label: 'BULB',
          nodes: {
            41: { id: 41, typeId: 'xod/core/inputBool' },
            42: { id: 42, typeId: 'led' },
          },
          links: {
            2: link(2, [41, 'PIN', 'brightness', 42]),
          },
        },
      },
      nodeTypes: R.merge(ioTypes, buttonAndLedTypes),
    });

    const [k1, k2, k3] = result.topology;

    assert(
      R.equals(
        R.map(id => result.nodes[id].implId, result.topology),
        ['button', 'xod/core/inputBool', 'led']
      )
    );

    assert(hasLink(result,
                   [k1, 'state', 'PIN', k2]),
           'button should be connected to inputBool');

    assert(hasLink(result,
                   [k2, 'PIN', 'brightness', k3]),
           'inputBool should be connected to led');

    assert(R.equals(result.nodes[k2].inputTypes,
                    { PIN: Boolean }),
           'inputBool should get a proper inputType');
  });

  it('injected output should be connected properly', () => {
    const result = transform({
      patches: {
        1: {
          id: 1,
          nodes: {
            100: { id: 100, typeId: 'foo/BTN' },
            101: { id: 101, typeId: 'led' },
          },
          links: {
            1: link(1, [100, '42', 'brightness', 101]),
          },
        },
        2: {
          id: 2,
          label: 'BTN',
          nodes: {
            41: { id: 41, typeId: 'button' },
            42: { id: 42, typeId: 'xod/core/outputBool' },
          },
          links: {
            2: link(2, [41, 'state', 'PIN', 42]),
          },
        },
      },
      nodeTypes: R.merge(ioTypes, buttonAndLedTypes),
    });

    const [k1, k2, k3] = result.topology;

    assert(hasTopology(result)([
      [k1, 'button'],
      [k2, 'xod/core/outputBool'],
      [k3, 'led'],
    ]));

    assert(hasLink(result,
                   [k1, 'state', 'PIN', k2]),
           'button should be connected to outputBool');

    assert(hasLink(result,
                   [k2, 'PIN', 'brightness', k3]),
           'outputBool should be connected to led');
  });

  it('injected input should be connected properly', () => {
    const result = transform({
      patches: {
        1: {
          id: 1,
          nodes: {
            100: { id: 100, typeId: 'button' },
            101: { id: 101, typeId: 'foo/BULB' },
          },
          links: {
            1: link(1, [100, 'state', '41', 101]),
          },
        },
        2: {
          id: 2,
          label: 'BULB',
          nodes: {
            41: { id: 41, typeId: 'xod/core/inputBool' },
            42: { id: 42, typeId: 'led' },
          },
          links: {
            2: link(2, [41, 'PIN', 'brightness', 42]),
          },
        },
      },
      nodeTypes: R.merge(ioTypes, buttonAndLedTypes),
    });

    const [k1, k2, k3] = result.topology;

    assert(hasTopology(result)([
      [k1, 'button'],
      [k2, 'xod/core/inputBool'],
      [k3, 'led'],
    ]));

    assert(hasLink(result,
                   [k1, 'state', 'PIN', k2]),
           'button should be connected to inputBool');

    assert(hasLink(result,
                   [k2, 'PIN', 'brightness', k3]),
           'inputBool should be connected to led');

    assert(R.equals(result.nodes[k2].inputTypes,
                    { PIN: Boolean }),
           'inputBool should get a proper inputType');
  });

  it('nested patch nodes (w/o loops) should be injected properly', () => {
    /*
         button
            |
    AUX-inputBool-------+
    |        |          |
    | NOP-inputBool---+ |
    | |       |       | |
    | |       |       | |
    | +---outputBool--+ |
    |        |          |
    +----outputBool-----+
            |
     NOP-inputBool---+
     |       |       |
     |       |       |
     +---outputBool--+
            |
           led
    */
    const result = transform({
      patches: {
        1: {
          id: 1,
          nodes: {
            100: { id: 100, typeId: 'button' },
            101: { id: 101, typeId: 'foo/AUX' },
            102: { id: 102, typeId: 'foo/NOP' },
            103: { id: 103, typeId: 'led' },
          },
          links: {
            1: link(1, [100, 'state', '41', 101]),
            2: link(2, [101, '43', '61', 102]),
            3: link(3, [102, '62', 'brightness', 103]),
          },
        },
        2: {
          id: 2,
          label: 'AUX',
          nodes: {
            41: { id: 41, typeId: 'xod/core/inputBool' },
            42: { id: 42, typeId: 'foo/NOP' },
            43: { id: 43, typeId: 'xod/core/outputBool' },
          },
          links: {
            4: link(4, [41, 'PIN', '61', 42]),
            5: link(5, [42, '62', 'PIN', 43]),
          },
        },
        3: {
          id: 3,
          label: 'NOP',
          nodes: {
            61: { id: 61, typeId: 'xod/core/inputBool' },
            62: { id: 62, typeId: 'xod/core/outputBool' },
          },
          links: {
            6: link(6, [61, 'PIN', 'PIN', 62]),
          },
        },
      },
      nodeTypes: R.merge(ioTypes, buttonAndLedTypes),
    });

    const keys = result.topology;

    assert(hasTopology(result)([
      [keys[0], 'button'],
      [keys[1], 'xod/core/inputBool'],
      [keys[2], 'xod/core/inputBool'],
      [keys[3], 'xod/core/outputBool'],
      [keys[4], 'xod/core/outputBool'],
      [keys[5], 'xod/core/inputBool'],
      [keys[6], 'xod/core/outputBool'],
      [keys[7], 'led'],
    ]));
  });
});
