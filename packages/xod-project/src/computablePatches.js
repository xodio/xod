import * as R from 'ramda';
import { Maybe } from 'ramda-fantasy';
import { mapIndexed } from 'xod-func-tools';

import * as CONST from './constants';
import * as PatchPathUtils from './patchPathUtils';
import * as Patch from './patch';
import * as Node from './node';
import * as Link from './link';
import * as Pin from './pin';

import { getGenuinePatchByPath } from './internal/project';

// =============================================================================
//
// Computable patches depends on
//
// =============================================================================

const TO_JSON_ABSTRACT_PATCH_PATH = 'xod/json/to-json';
const CONCAT_PATCH_PATH = 'xod/core/concat';

// =============================================================================
//
// Patch creators for the record patch
//
// =============================================================================

// Creates an unpack record patch
//
// :: Patch -> Maybe Patch
export const createUnpackRecordPatch = recordPatch => {
  const type = Patch.getPatchPath(recordPatch);
  const inputTypeTerminal = PatchPathUtils.getTerminalPath(
    CONST.PIN_DIRECTION.INPUT,
    type
  );

  const nodesForUnpackPatch = R.compose(
    R.reject(R.isNil),
    R.map(node =>
      R.compose(
        fn => fn(node),
        R.cond([
          // * :: NodeType -> (NodeType -> Node -> Node)
          // output-self -> input-patchPath
          [
            R.equals(CONST.OUTPUT_SELF_PATH),
            () => Node.setNodeType(inputTypeTerminal),
          ],
          // output-* -> NULL (??)
          [PatchPathUtils.isOutputTerminalPath, () => R.always(null)],
          // input-* -> output-*
          [
            PatchPathUtils.isInputTerminalPath,
            R.compose(
              Node.setNodeType(R.__),
              PatchPathUtils.getTerminalPath(CONST.PIN_DIRECTION.OUTPUT),
              PatchPathUtils.getTerminalDataType
            ),
          ],
          // record -> unpack-record
          [
            R.equals(CONST.RECORD_MARKER_PATH),
            () => Node.setNodeType(CONST.UNPACK_RECORD_MARKER_PATH),
          ],
          // omit other nodes
          [R.T, () => R.always(null)],
        ]),
        Node.getNodeType
      )(node)
    ),
    Patch.listNodes
  )(recordPatch);

  return R.compose(
    Maybe.of,
    Patch.upsertNodes(nodesForUnpackPatch),
    Patch.setPatchPath(PatchPathUtils.getUnpackRecordPath(type)),
    Patch.createPatch
  )();
};

// Creates a `to-json` specialization for the record if it does not exist in the
// project. It might returns Maybe.Nothing either if this patch already exists or
// some of patches, which the new patch depends on, are missing in the project:
// - xod/core/concat
// - xod/json/to-json
//
// :: Patch -> Project -> Maybe Patch
export const createToJsonRecordSpecialization = (recordPatch, project) => {
  // Do not try to do anything if some of the required nodes does not
  // exist in the project.
  // Required nodes:
  // - xod/core/concat
  // - xod/json/to-json
  const toJsonAbstractPatch = getGenuinePatchByPath(
    TO_JSON_ABSTRACT_PATCH_PATH,
    project
  );
  const concatPatch = getGenuinePatchByPath(CONCAT_PATCH_PATH, project);
  if (!toJsonAbstractPatch || !concatPatch) return Maybe.Nothing();

  const type = Patch.getPatchPath(recordPatch);
  const inputTypeTerminal = PatchPathUtils.getTerminalPath(
    CONST.PIN_DIRECTION.INPUT,
    type
  );
  const basename = PatchPathUtils.getBaseName(type);

  const toJsonRecordPatchPath = PatchPathUtils.getToJsonRecordPath(type);

  // Do not recreate a `to-json` specialization
  // due to further patch mutations in transpilation
  if (getGenuinePatchByPath(toJsonRecordPatchPath, project))
    return Maybe.Nothing();

  // Note:
  // unpack-record output pin keys is equal to input pins of a record
  // so it might be used as is to generate `to-json(record)` patch
  const recordPins = R.compose(Pin.normalizeEmptyPinLabels, Patch.listPins)(
    recordPatch
  );

  const recordInputPins = R.filter(Pin.isInputPin, recordPins);
  const recordOutputPin = R.find(Pin.isOutputPin, recordPins);

  // Find out pin keys for an abstract `xod/json/to-json` node
  const jsonPinKeys = R.compose(
    R.map(Pin.getPinKey),
    R.indexBy(Pin.getPinDirection),
    Patch.listPins
  )(toJsonAbstractPatch);

  // Find out pin keys for a `xod/core/concat` node
  const concatPinKeys = R.compose(
    R.map(Pin.getPinKey),
    R.applySpec({
      inputFirst: R.find(
        R.both(Pin.isInputPin, R.compose(R.equals(0), Pin.getPinOrder))
      ),
      inputVariadic: R.find(
        R.both(Pin.isInputPin, R.compose(R.equals(1), Pin.getPinOrder))
      ),
      output: R.find(Pin.isOutputPin),
    }),
    Patch.listPins
  )(concatPatch);

  // :: [Node]
  const nodesForToJsonPatch = [
    // Input terminal
    R.compose(
      Node.setNodeId(`input-${basename}`),
      Node.createNode({ x: 0, y: 0 })
    )(inputTypeTerminal),
    // Unpack
    R.compose(
      Node.setNodeId(`unpack-${basename}`),
      Node.createNode({ x: 0, y: 1 }),
      PatchPathUtils.getUnpackRecordPath
    )(type),
    // Abstract to-json for each output of unpack node
    ...mapIndexed((_, idx) =>
      R.compose(
        Node.setNodeId(`toJson-${idx}`),
        Node.createNode({ x: (idx + 1) * 3 - 1, y: 2 })
      )(TO_JSON_ABSTRACT_PATCH_PATH)
    )(recordInputPins),
    // Concat
    R.compose(
      R.addIndex(R.reduce)(
        (node, pin, idx) => {
          const keyPinKey =
            idx === 0
              ? concatPinKeys.inputVariadic
              : Pin.addVariadicPinKeySuffix(
                  idx * 3,
                  concatPinKeys.inputVariadic
                );

          const thirdPinKey = Pin.addVariadicPinKeySuffix(
            (idx + 1) * 3 - 1,
            concatPinKeys.inputVariadic
          );
          return R.compose(
            Node.setBoundValue(
              thirdPinKey,
              idx === recordInputPins.length - 1 ? '"}"' : '","'
            ),
            Node.setBoundValue(keyPinKey, `""${Pin.getPinLabel(pin)}":"`)
          )(node);
        },
        R.__,
        recordInputPins
      ),
      Node.setBoundValue(concatPinKeys.inputFirst, '"{"'),
      Node.setNodeArityLevel((recordPins.length - 1) * 3),
      Node.setNodeId('concat'),
      Node.createNode({ x: 0, y: 3 })
    )(CONCAT_PATCH_PATH),
    // Output string
    R.compose(
      Node.setNodeId('output-json-string'),
      Node.createNode({ x: 0, y: 4 }),
      PatchPathUtils.getTerminalPath
    )(CONST.PIN_DIRECTION.OUTPUT, CONST.PIN_TYPE.STRING),
  ];

  // :: [Link]
  const linksForToJsonPatch = [
    // input -> unpack
    Link.createLink(
      Pin.getPinKey(recordOutputPin), // input of unpack
      `unpack-${basename}`,
      CONST.TERMINAL_PIN_KEYS[CONST.PIN_DIRECTION.OUTPUT],
      `input-${basename}`
    ),
    // unpack -> to-json (for each)
    ...mapIndexed((pin, idx) =>
      Link.createLink(
        jsonPinKeys[CONST.PIN_DIRECTION.INPUT],
        `toJson-${idx}`,
        Pin.getPinKey(pin),
        `unpack-${basename}`
      )
    )(recordInputPins),
    // to-json -> concat (for each)
    ...mapIndexed((pin, idx) =>
      Link.createLink(
        Pin.addVariadicPinKeySuffix(
          (idx + 1) * 3 - 2,
          concatPinKeys.inputVariadic
        ),
        'concat',
        jsonPinKeys[CONST.PIN_DIRECTION.OUTPUT],
        `toJson-${idx}`
      )
    )(recordInputPins),
    // concat -> output
    Link.createLink(
      CONST.TERMINAL_PIN_KEYS[CONST.PIN_DIRECTION.INPUT],
      'output-json-string',
      concatPinKeys.output,
      'concat'
    ),
  ];

  return R.compose(
    Maybe.of,
    Patch.upsertLinks(linksForToJsonPatch),
    Patch.upsertNodes(nodesForToJsonPatch),
    Patch.setPatchPath(toJsonRecordPatchPath),
    Patch.createPatch
  )();
};
