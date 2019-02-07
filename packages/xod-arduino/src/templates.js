import * as R from 'ramda';
import Handlebars from 'handlebars';

import { unquote } from 'xod-func-tools';
import * as XP from 'xod-project';

import { def } from './types';

import configTpl from '../platform/configuration.tpl.cpp';
import patchContextTpl from '../platform/patchContext.tpl.cpp';
import implListTpl from '../platform/implList.tpl.cpp';
import programTpl from '../platform/program.tpl.cpp';

import preambleH from '../platform/preamble.h';
import listViewsH from '../platform/listViews.h';
import listFuncsH from '../platform/listFuncs.h';
import typesH from '../platform/types.h';
import formatNumberH from '../platform/formatNumber.h';
import uartH from '../platform/uart.h';
import memoryH from '../platform/memory.h';
import stlH from '../platform/stl.h';
import runtimeCpp from '../platform/runtime.cpp';

// =============================================================================
//
// Utils and helpers
//
// =============================================================================

const kebabToSnake = R.replace(/-/g, '_');

// foo(number,string) -> foo__number__string
const sanitizeTypeSpecification = R.compose(
  R.replace(/\(|,/g, '__'),
  R.replace(')', '')
);

// :: PatchPath -> String
const patchPathToNSName = R.converge(
  R.pipe(Array.of, R.map(kebabToSnake), R.join('__')),
  [
    R.ifElse(XP.isPathLibrary, XP.getOwnerName, R.always('')),
    R.ifElse(XP.isPathLibrary, R.pipe(R.split('/'), R.nth(1)), R.always('')),
    R.pipe(XP.getBaseName, sanitizeTypeSpecification),
  ]
);

const trimTrailingWhitespace = R.replace(/\s+$/gm, '\n');

const omitLocalIncludes = R.replace(/#include ".*$/gm, '');

const indexByPinKey = R.indexBy(R.prop('pinKey'));

const getPatchPins = direction =>
  R.compose(indexByPinKey, R.path(['patch', direction]));

const omitNullValues = R.map(
  R.when(R.propSatisfies(R.isNil, 'value'), R.omit(['value']))
);

const getNodePins = direction =>
  R.compose(indexByPinKey, omitNullValues, R.prop(direction));

const mergeAndListPins = (direction, node) =>
  R.compose(
    R.values,
    R.converge(R.mergeWith(R.merge), [
      getPatchPins(direction),
      getNodePins(direction),
    ])
  )(node);

const builtInTypeNames = {
  [XP.PIN_TYPE.PULSE]: 'Logic',
  [XP.PIN_TYPE.BOOLEAN]: 'Logic',
  [XP.PIN_TYPE.NUMBER]: 'Number',
  [XP.PIN_TYPE.STRING]: 'XString',
  [XP.PIN_TYPE.BYTE]: 'uint8_t',
  [XP.PIN_TYPE.PORT]: 'uint8_t',
};

// Converts DataType value to a corresponding C++ storage type
const cppType = def(
  'cppType :: DataType -> String',
  R.ifElse(
    R.has(R.__, builtInTypeNames),
    R.prop(R.__, builtInTypeNames),
    // it is a custom type
    R.pipe(patchPathToNSName, ns => `${ns}::Type`)
  )
);

// Formats a plain JS string into C++ string object
const cppStringLiteral = def(
  'cppStringLiteral :: String -> String',
  R.ifElse(
    R.isEmpty,
    R.always('XString()'),
    str => `XStringCString("${R.replace(/"/g, '\\"', str)}")`
  )
);

export const byteLiteralToDecimal = R.ifElse(
  R.test(/(b|h|d)$/),
  R.converge(parseInt, [
    R.init,
    R.compose(
      R.prop(R.__, {
        b: 2,
        h: 16,
        d: 10,
      }),
      R.last
    ),
  ]),
  plainDecimal => parseInt(plainDecimal, 10)
);

// Formats XOD byte literal into C++ byte literal
// E.G.
// 00011101b -> 0x1D
// FAh -> 0xFA
// 29d -> 0x1D
// 10 -> 0xA
// and leave char literals as is
// 'a' -> 'a'
// '\n' -> '\n'
const cppByteLiteral = def(
  'cppByteLiteral :: String -> String',
  R.unless(
    XP.isValidCharLiteral,
    R.compose(
      R.concat('0x'),
      R.toUpper,
      x => x.toString(16),
      byteLiteralToDecimal
    )
  )
);

// Formats XOD port literal into C++ literal
// E.G.
// 3 -> 3
// D13 -> 13
// A3 -> A3
const cppPortLiteral = def(
  'cppPortLiteral :: String -> String',
  R.when(R.test(/^D\d+$/i), R.tail)
);

// =============================================================================
//
// Handlebars helpers
//
// =============================================================================

// Merge patch pins data with node pins data
Handlebars.registerHelper('mergePins', function mergePins() {
  this.inputs = mergeAndListPins('inputs', this);
  this.outputs = mergeAndListPins('outputs', this);
});

// Generate patch-level namespace name
Handlebars.registerHelper('ns', R.pipe(R.prop('patchPath'), patchPathToNSName));

// Debug helper
Handlebars.registerHelper('json', JSON.stringify);

// https://github.com/wycats/handlebars.js/issues/927
Handlebars.registerHelper('switch', function switchHelper(value, options) {
  this._switch_value_ = value;
  const html = options.fn(this); // Process the body of the switch block
  delete this._switch_value_;
  return html;
});

Handlebars.registerHelper('case', function caseHelper(value, options) {
  if (value === this._switch_value_) {
    return options.fn(this);
  }

  return undefined;
});

// Returns declaration type specifier for an initial value of an output
Handlebars.registerHelper(
  'decltype',
  (type, value) =>
    type === XP.PIN_TYPE.STRING && unquote(value) !== ''
      ? 'static XStringCString'
      : `constexpr ${cppType(type)}`
);

// Check that variable is not undefined
Handlebars.registerHelper('exists', function existsHelper(variable, options) {
  return typeof variable !== 'undefined'
    ? options.fn(this)
    : options.inverse(this);
});

// Temporary switch to global C++ namespace
Handlebars.registerHelper('global', function global(options) {
  return [
    '// --- Enter global namespace ---',
    '}}',
    options.fn(this),
    'namespace xod {',
    `namespace ${patchPathToNSName(this.patchPath)} {`,
    '// --- Back to local namespace ---',
  ].join('\n');
});

Handlebars.registerHelper('cppType', type => cppType(type));

// Converts bound value literals or JS-typed data value to a
// string that is valid and expected C++ literal representing that value
Handlebars.registerHelper('cppValue', (type, value) =>
  R.propOr(R.always(`{ /* ${type} */ }`), type, {
    [XP.PIN_TYPE.PULSE]: R.always('false'),
    [XP.PIN_TYPE.BOOLEAN]: v => (v === 'True' ? 'true' : 'false'),
    [XP.PIN_TYPE.NUMBER]: R.cond([
      [R.equals('Inf'), R.always('INFINITY')],
      [R.equals('+Inf'), R.always('INFINITY')],
      [R.equals('-Inf'), R.always('(-INFINITY)')],
      [R.equals('NaN'), R.always('NAN')],
      [R.T, R.identity],
    ]),
    [XP.PIN_TYPE.STRING]: R.pipe(unquote, cppStringLiteral),
    [XP.PIN_TYPE.BYTE]: cppByteLiteral,
    [XP.PIN_TYPE.PORT]: cppPortLiteral,
  })(value)
);

// A helper to quickly introduce a new filtered {{each ...}} loop
function registerHandlebarsFilterLoopHelper(name, predicate) {
  Handlebars.registerHelper(name, (list, block) =>
    R.compose(R.join(''), R.map(node => block.fn(node)), R.filter(predicate))(
      list
    )
  );
}

registerHandlebarsFilterLoopHelper(
  'eachDeferNode',
  R.path(['patch', 'isDefer'])
);
registerHandlebarsFilterLoopHelper(
  'eachNonConstantNode',
  R.pathEq(['patch', 'isConstant'], false)
);
registerHandlebarsFilterLoopHelper(
  'eachNodeUsingTimeouts',
  R.path(['patch', 'usesTimeouts'])
);
registerHandlebarsFilterLoopHelper(
  'eachTweakNode',
  R.pipe(R.path(['patch', 'patchPath']), XP.isTweakPath)
);
registerHandlebarsFilterLoopHelper('eachLinkedInput', R.has('fromNodeId'));
registerHandlebarsFilterLoopHelper(
  'eachNonlinkedInput',
  R.complement(R.has('fromNodeId'))
);
registerHandlebarsFilterLoopHelper('eachDirtyablePin', R.prop('isDirtyable'));

// =============================================================================
//
// Templates and settings
//
// =============================================================================
const renderingOptions = {
  noEscape: true,
  strict: true,
};

// Basic templates
const templates = {
  config: Handlebars.compile(configTpl, renderingOptions),
  patchContext: Handlebars.compile(patchContextTpl, renderingOptions),
  implList: Handlebars.compile(implListTpl, renderingOptions),
  program: Handlebars.compile(programTpl, renderingOptions),
};

// =============================================================================
//
// Rendering functions
//
// =============================================================================
export const renderConfig = def(
  'renderConfig :: TConfig -> String',
  templates.config
);
export const renderPatchContext = def(
  'renderPatchContext :: TPatch -> String',
  templates.patchContext
);
export const renderImpl = def('renderImpl :: TPatch -> String', data => {
  const ctx = R.applySpec({
    patchPath: R.prop('patchPath'),
    GENERATED_CODE: renderPatchContext,
  })(data);

  const patchImpl = R.prop('impl', data);
  return Handlebars.compile(patchImpl, renderingOptions)(ctx);
});
export const renderImplList = def(
  'renderImplList :: [TPatch] -> String',
  R.compose(
    trimTrailingWhitespace,
    templates.implList,
    R.map(patch => R.assoc('implementation', renderImpl(patch), patch))
  )
);

export const renderProgram = def('renderProgram :: [TNode] -> String', nodes =>
  trimTrailingWhitespace(templates.program({ nodes }))
);
export const renderProject = def(
  'renderProject :: TProject -> String',
  originalProject => {
    // HACK: We have to clone TProject to prevent mutating
    // of original TProject by Handlebars templates.
    const project = R.clone(originalProject);

    const config = renderConfig(project.config);
    const impls = renderImplList(project.patches);
    const program = renderProgram(project.nodes);

    return R.join('\n')([
      preambleH,
      config,
      stlH,
      typesH,
      listViewsH,
      memoryH,
      uartH,
      omitLocalIncludes(listFuncsH),
      formatNumberH,
      runtimeCpp,
      impls,
      program,
    ]);
  }
);
