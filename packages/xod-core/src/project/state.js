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

const removeNils = R.reject(R.isNil);

// :: (String -> String -> String) -> Object -> Object
export const getNodeTypes = R.uncurryN(2, getImpl => R.compose(
  R.indexBy(R.prop('id')),
  R.values,
  R.mapObjIndexed((meta, id) => R.merge(
    R.omit(['inputs', 'outputs'], meta),
    {
      id,
      pins: mapNodeTypePins(meta),
      impl: removeNils({
        js: getImpl('js', id, '.js'),
        espruino: getImpl('espruino', id, '.js'),
      }),
    }
  ))
));

export const getInitialState = nodeTypes => ({
  meta: {
    id: 1,
    name: 'Awesome project',
    author: 'Amperka team',
  },
  patches: {
    1: {
      id: '1',
      label: 'Main',
      nodes: {},
      links: {},
    },
    2: {
      id: '2',
      label: 'AUX',
      nodes: {},
      links: {},
    },
  },
  nodeTypes,
  folders: {},
});
