import * as R from 'ramda';
import Handlebars from 'handlebars';

import { unquote } from 'xod-func-tools';
import * as XP from 'xod-project';

import { def } from './types';

import parseImplementation from './parseImplementation';
import parseLegacyImplementation from './parseLegacyImplementation';

import configTpl from '../platform/configuration.tpl.cpp';
import patchContextTpl from '../platform/patchContext.tpl.cpp';
import patchPinTypesTpl from '../platform/patchPinTypes.tpl.cpp';
import patchTemplateDefinitionTpl from '../platform/patchTemplateDefinition.tpl.cpp';
import legacyPatchTpl from '../platform/patch.legacy.tpl.cpp';
import patchTpl from '../platform/patch.tpl.cpp';
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
  [XP.PIN_TYPE.PULSE]: 'Pulse',
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
  R.cond([
    // Empty literal: ``
    [R.isEmpty, R.always('XString()')],
    // Empty string literal: `""`
    [R.pipe(unquote, R.isEmpty), R.always('XString()')],
    // Special string literal: `=XOD_LITERAL`
    [
      str => R.any(R.equals(str), R.values(XP.GLOBALS_LITERALS)),
      R.tail, // `XOD_LITERAL`
    ],
    // All other strings: "Hello, world"
    [R.T, str => `XStringCString("${R.replace(/"/g, '\\"', unquote(str))}")`],
  ])
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
Handlebars.registerHelper('switchByTweakType', function switchHelper(
  value,
  options
) {
  this._switch_value_ = XP.getTweakType(value);
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

Handlebars.registerHelper('getStringTweakLength', XP.getStringTweakLength);

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
    [XP.PIN_TYPE.STRING]: cppStringLiteral,
    [XP.PIN_TYPE.BYTE]: cppByteLiteral,
    [XP.PIN_TYPE.PORT]: cppPortLiteral,
    [XP.BINDABLE_CUSTOM_TYPES.COLOR]: R.compose(
      rgb => `/* RGB */ { ${rgb} }`,
      R.join(', '),
      R.map(R.concat('0x')),
      R.splitEvery(2),
      R.tail
    ),
  })(value)
);

const hasUpstreamErrorRaisers = nodeOrInput =>
  R.pathOr(0, ['upstreamErrorRaisers', 'length'], nodeOrInput) > 0;

Handlebars.registerHelper('hasUpstreamErrorRaisers', hasUpstreamErrorRaisers);

Handlebars.registerHelper(
  'needsHasUpstreamErrorFlag',
  R.either(hasUpstreamErrorRaisers, R.path(['patch', 'isDefer']))
);

const isOutputLinked = R.pipe(R.pathOr(0, ['to', 'length']));

Handlebars.registerHelper(
  'shouldOutputStoreDirtyness',
  R.both(
    isOutputLinked,
    R.propSatisfies(R.any(R.prop('doesAffectDirtyness')), 'to')
  )
);

const isLinkedTweakNode = R.both(
  R.pipe(R.path(['patch', 'patchPath']), XP.isTweakPath),
  R.pathSatisfies(isOutputLinked, ['outputs', 0])
);

Handlebars.registerHelper('isLinkedTweakNode', isLinkedTweakNode);

Handlebars.registerHelper('isPulse', R.equals(XP.PIN_TYPE.PULSE));

// TODO: better name!
const isTemplatableCustomTypePin = R.prop('isTemplatableCustomTypePin');
Handlebars.registerHelper(
  'isTemplatableCustomTypePin',
  isTemplatableCustomTypePin
);

Handlebars.registerHelper(
  'templatableCustomTypeInputs',
  R.filter(isTemplatableCustomTypePin)
);

Handlebars.registerHelper(
  'containsTemplatableCustomTypeInputs',
  R.pipe(R.filter(isTemplatableCustomTypePin), R.isEmpty, R.not)
);

const isConstantType = type => XP.CONSTANT_PIN_TYPES.includes(type);

Handlebars.registerHelper('isConstantType', isConstantType);

const isConstantPin = ({ type }) => isConstantType(type);

Handlebars.registerHelper('constantInputs', R.filter(isConstantPin));

Handlebars.registerHelper(
  'containsConstantInputs',
  R.pipe(R.filter(isConstantPin), R.isEmpty, R.not)
);

Handlebars.registerHelper(
  'indent',
  R.compose(
    R.join('\n'),
    R.map(R.unless(R.isEmpty, str => `    ${str}`)),
    R.split('\n')
  )
);

Handlebars.registerHelper('unindent', str => str.replace(/^( {1,4}|\t)/gm, ''));

Handlebars.registerHelper({
  eq: (v1, v2) => v1 === v2,
  ne: (v1, v2) => v1 !== v2,
  lt: (v1, v2) => v1 < v2,
  gt: (v1, v2) => v1 > v2,
  lte: (v1, v2) => v1 <= v2,
  gte: (v1, v2) => v1 >= v2,
  and(...args) {
    return Array.prototype.every.call(args, Boolean);
  },
  or(...args) {
    return Array.prototype.slice.call(args, 0, -1).some(Boolean);
  },
});

// A helper to quickly introduce a new filtered {{each ...}} loop
function registerHandlebarsFilterLoopHelper(name, predicate) {
  Handlebars.registerHelper(name, (list, block) => {
    const filteredList = R.filter(predicate, list);
    const lastIndex = filteredList.length - 1;

    return filteredList
      .map((node, index) =>
        block.fn(node, {
          data: { index, first: index === 0, last: index === lastIndex },
        })
      )
      .join('');
  });
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
registerHandlebarsFilterLoopHelper('eachLinkedTweakNode', isLinkedTweakNode);
registerHandlebarsFilterLoopHelper('eachLinkedInput', R.has('fromNodeId'));
registerHandlebarsFilterLoopHelper(
  'eachNonlinkedInput',
  R.complement(R.has('fromNodeId'))
);
registerHandlebarsFilterLoopHelper('eachDirtyablePin', R.prop('isDirtyable'));
registerHandlebarsFilterLoopHelper(
  'eachInputPinWithUpstreamRaisers',
  R.pathOr(0, ['upstreamErrorRaisers', 'length'])
);
registerHandlebarsFilterLoopHelper(
  'eachPulseOutput',
  R.propEq('type', XP.PIN_TYPE.PULSE)
);
registerHandlebarsFilterLoopHelper(
  'eachNonPulse',
  R.complement(R.propEq('type', XP.PIN_TYPE.PULSE))
);
registerHandlebarsFilterLoopHelper(
  'eachNonPulseOrConstant',
  ({ type }) => type !== XP.PIN_TYPE.PULSE && !isConstantType(type)
);

Handlebars.registerPartial(
  'patchTemplateDefinition',
  patchTemplateDefinitionTpl
);

export const withTetheringInetNode = R.find(
  R.both(
    R.pipe(R.path(['patch', 'patchPath']), XP.isTetheringInetPatchPath),
    R.pathSatisfies(isOutputLinked, ['outputs', 0])
  )
);
Handlebars.registerHelper('withTetheringInetNode', (nodes, block) =>
  R.compose(R.ifElse(R.isNil, block.inverse, block.fn), withTetheringInetNode)(
    nodes
  )
);

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
  patchPinTypes: Handlebars.compile(patchPinTypesTpl, renderingOptions),
  implList: Handlebars.compile(implListTpl, renderingOptions),
  patchImpl: Handlebars.compile(patchTpl, renderingOptions),
  legacyPatchImpl: Handlebars.compile(legacyPatchTpl, renderingOptions),
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

export const renderPatchPinTypes = def(
  'renderPatchPinTypes :: TPatch -> String',
  templates.patchPinTypes
);

const generatedCodeRegEx = /^\s*{{\s*GENERATED_CODE\s*}}\s*$/gm;

export const renderImpl = def('renderImpl :: TPatch -> String', tPatch => {
  const impl = R.prop('impl', tPatch);
  const generatedCode = renderPatchContext(tPatch);
  const patchPinTypes = renderPatchPinTypes(tPatch);

  const isLegacyImplementation = R.test(generatedCodeRegEx, impl);

  if (isLegacyImplementation) {
    const parsedImpl = R.compose(
      parseLegacyImplementation,
      R.replace(/ValueType<(input|output)_(...)>::T/g, 'typeof_$2')
    )(impl);

    const ctx = R.merge(
      {
        patch: tPatch,
        generatedCode,
        patchPinTypes,
      },
      parsedImpl
    );

    return templates.legacyPatchImpl(ctx);
  }

  const parsedImpl = parseImplementation(impl);

  const ctx = R.merge(
    {
      patch: tPatch,
      generatedCode,
      patchPinTypes,
    },
    parsedImpl
  );

  return templates.patchImpl(ctx);
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
    // TODO: right at the beginning of `program.tpl.cpp`
    // TNode pins are mutated by mergePins helper
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
