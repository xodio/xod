import R from 'ramda';

//-----------------------------------------------------------------------------
// Defaultizers
//-----------------------------------------------------------------------------

export const defaultizeLink = R.merge({
  id: '$$defaultLinkId',
  input: { nodeId: '$$defaultInputNodeId', pinKey: '$$defaultInputPin' },
  output: { nodeId: '$$defaultOutputNodeId', pinKey: '$$defaultOutputPin' },
});

export const defaultizeNode = R.merge({
  id: '$$defaultNodeId',
  position: { x: 0, y: 0 },
  type: '@/defaultType',
});

export const defaultizePatch = R.compose(
  R.evolve({
    nodes: R.map(defaultizeNode),
    links: R.map(defaultizeLink),
    impls: R.identity,
    pins: R.identity,
  }),
  R.merge({
    nodes: {},
    links: {},
    impls: {},
    pins: {},
  })
);

export const defaultizeProject = R.compose(
  R.evolve({
    patches: R.map(defaultizePatch),
  }),
  R.merge({
    patches: {},
  })
);
