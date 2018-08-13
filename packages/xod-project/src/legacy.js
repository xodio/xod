import R from 'ramda';
import { Maybe } from 'ramda-fantasy';
import { enquote, unquote, foldMaybe, catMaybies } from 'xod-func-tools';

import { def } from './types';
import { PIN_TYPE, INPUT_PULSE_PIN_BINDING_OPTIONS } from './constants';

import * as Project from './project';
import * as Patch from './patch';
import * as Node from './node';
import * as Pin from './pin';

//
// Literals
//
const LEGACY_BOUND_VALUES_PROP = 'boundValues';

/**
 * Ensure that DataValue is a Literal.
 * In case DataValue contains an legacy DataValue, converts it into Literal.
 */
export const ensureLiteral = def(
  'ensureLiteral :: DataType -> DataValue -> Maybe DataValue',
  R.compose(Maybe, (type, value) => {
    switch (type) {
      case PIN_TYPE.PULSE:
        return R.compose(
          R.when(
            R.either(R.equals(false), R.equals('false')),
            R.always(INPUT_PULSE_PIN_BINDING_OPTIONS.NEVER)
          ),
          R.when(
            R.has(R.__, INPUT_PULSE_PIN_BINDING_OPTIONS),
            R.prop(R.__, INPUT_PULSE_PIN_BINDING_OPTIONS)
          )
        )(value);
      case PIN_TYPE.BOOLEAN:
        return R.when(R.is(Boolean), v => (v ? 'True' : 'False'))(value);
      case PIN_TYPE.NUMBER:
        return R.when(R.is(Number), R.toString)(value);
      case PIN_TYPE.STRING:
        return R.pipe(unquote, enquote)(value);
      default: {
        if (R.is(Number, value)) {
          return R.toString(value);
        }

        return null;
      }
    }
  })
);

// :: Pin -> Node -> Node
const convertBoundValueToBoundLiteral = R.curry((node, pin) => {
  const pinKey = Pin.getPinKey(pin);
  return R.compose(
    foldMaybe(node, R.identity),
    R.chain(
      R.compose(
        R.map(
          R.compose(
            R.dissocPath([LEGACY_BOUND_VALUES_PROP, pinKey]),
            Node.setBoundValue(pinKey, R.__, node)
          )
        ),
        ensureLiteral(Pin.getPinType(pin))
      )
    ),
    Maybe,
    R.path([LEGACY_BOUND_VALUES_PROP, pinKey])
  )(node);
});

// :: [Pin] -> Node -> Node
const migrateNodeBoundValues = R.curry((node, pins) => {
  const pinKeys = R.map(Pin.getPinKey, pins);
  return R.compose(
    // and then convert all other bound values
    R.reduce(convertBoundValueToBoundLiteral, R.__, pins),
    // omit bound values to nonexistent pins
    wrongPinKeys =>
      R.over(R.lensProp(LEGACY_BOUND_VALUES_PROP), R.omit(wrongPinKeys), node),
    R.difference(R.__, pinKeys),
    R.keys,
    R.prop(LEGACY_BOUND_VALUES_PROP)
  )(node);
});

// This function will be called for Nodes, that have a NodeType,
// that does not exist in the Project/Workspace
// E.G. Project uses third-party library and it's not installed yet
// :: Node -> Node
const migrateNodeBoundValuesWithoutTypes = node =>
  R.compose(
    R.reduce(
      (acc, [pinKey, pinValue]) =>
        R.compose(
          R.dissocPath([LEGACY_BOUND_VALUES_PROP, pinKey]),
          Node.setBoundValue
        )(pinKey, pinValue, acc),
      node
    ),
    R.toPairs,
    catMaybies,
    R.map(ensureLiteral(PIN_TYPE.DEAD)),
    R.propOr({}, LEGACY_BOUND_VALUES_PROP)
  )(node);

// :: Node -> Node
const omitEmptyBoundValues = R.when(
  R.has(LEGACY_BOUND_VALUES_PROP),
  R.over(R.lensProp(LEGACY_BOUND_VALUES_PROP), R.reject(R.isEmpty))
);

// :: Patch -> Project -> Project
const migratePatchBoundValuesToBoundLiterals = R.curry((patch, project) =>
  R.compose(
    Project.assocPatch(Patch.getPatchPath(patch), R.__, project),
    Patch.upsertNodes(R.__, patch),
    R.map(node =>
      R.compose(
        // Remove `boundValues` completely if it's empty
        R.when(
          R.pipe(R.prop(LEGACY_BOUND_VALUES_PROP), R.isEmpty),
          R.dissoc(LEGACY_BOUND_VALUES_PROP)
        ),
        R.ifElse(
          Maybe.isNothing,
          () => migrateNodeBoundValuesWithoutTypes(node),
          () =>
            R.compose(
              migrateNodeBoundValues(node),
              R.values,
              Project.getPinsForNode(R.__, patch, project)
            )(node)
        ),
        Project.getPatchByNode(R.__, project)
      )(node)
    ),
    R.map(omitEmptyBoundValues),
    Patch.listNodes
  )(patch)
);

export const migrateBoundValuesToBoundLiterals = def(
  'migrateBoundValuesToBoundLiterals :: Project -> Project',
  project =>
    R.compose(
      R.reduce(
        (proj, patch) =>
          R.ifElse(
            R.pipe(Patch.listNodes, R.any(R.has(LEGACY_BOUND_VALUES_PROP))),
            migratePatchBoundValuesToBoundLiterals(R.__, proj),
            R.always(proj)
          )(patch),
        project
      ),
      Project.listGenuinePatches
    )(project)
);
