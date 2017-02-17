import R from 'ramda';
import { PIN_DIRECTION } from './constants';

const mapDirectedNodeTypePins = (direction, collectionKey) => R.compose(
  R.indexBy(R.prop('key')),
  R.addIndex(R.map)((io, index) => R.merge({ index, direction }, io)),
  R.propOr([], collectionKey)
);

const mapNodeTypePins = meta => R.merge(
  mapDirectedNodeTypePins(PIN_DIRECTION.INPUT, 'inputs')(meta),
  mapDirectedNodeTypePins(PIN_DIRECTION.OUTPUT, 'outputs')(meta)
);

// :: (String -> String -> String) -> Object -> Object
export const genNodeTypes = R.compose(
  R.indexBy(R.prop('id')),
  R.values,
  R.mapObjIndexed((meta, id) => R.merge(
    R.omit(['inputs', 'outputs'], meta),
    {
      id,
      pins: mapNodeTypePins(meta),
    }
  ))
);

export const getInitialState = nodeTypes => ({
  meta: {
    name: 'Awesome project',
    author: 'Amperka team',
  },
  patches: {
    '@/1': {
      id: '@/1',
      label: 'Main',
      nodes: {},
      links: {},
    },
    '@/2': {
      id: '@/2',
      label: 'AUX',
      nodes: {},
      links: {},
    },
  },
  nodeTypes,
  folders: {},
});
