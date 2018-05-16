import * as R from 'ramda';
import Handlebars from 'handlebars';

import { unquote } from 'xod-func-tools';
import { PIN_TYPE } from 'xod-project';

import { def } from './types';

import configTpl from '../platform/configuration.tpl.cpp';
import patchContextTpl from '../platform/patchContext.tpl.cpp';
import implListTpl from '../platform/implList.tpl.cpp';
import programTpl from '../platform/program.tpl.cpp';

import preambleH from '../platform/preamble.h';
import listViewsH from '../platform/listViews.h';
import listFuncsH from '../platform/listFuncs.h';
import stlH from '../platform/stl.h';
import runtimeCpp from '../platform/runtime.cpp';

// =============================================================================
//
// Utils and helpers
//
// =============================================================================
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

// Converts DataType value to a corresponding C++ storage type
const cppType = def(
  'cppType :: DataType -> String',
  R.propOr('unknown_type<void>', R.__, {
    [PIN_TYPE.PULSE]: 'Logic',
    [PIN_TYPE.BOOLEAN]: 'Logic',
    [PIN_TYPE.NUMBER]: 'Number',
    [PIN_TYPE.STRING]: 'XString',
    [PIN_TYPE.BYTE]: 'uint8_t',
  })
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

// Formats XOD byte literal into C++ byte literal
// E.G.
// 00011101b -> 0x1D
// FAh -> 0xFA
// 29d -> 0x1D
const cppByteLiteral = def(
  'cppByteLiteral :: String -> String',
  R.compose(
    R.concat('0x'),
    R.toUpper,
    x => x.toString(16),
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
    ])
  )
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
Handlebars.registerHelper(
  'ns',
  R.compose(R.join('__'), R.props(['owner', 'libName', 'patchName']))
);

// Debug helper
Handlebars.registerHelper('json', JSON.stringify);

// Returns declaration type specifier for an initial value of an output
Handlebars.registerHelper(
  'decltype',
  (type, value) =>
    type === PIN_TYPE.STRING && unquote(value) !== ''
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
    `namespace ${this.owner}__${this.libName}__${this.patchName} {`,
    '// --- Back to local namespace ---',
  ].join('\n');
});

Handlebars.registerHelper('cppType', type => cppType(type));

const UNKNOWN_TYPE = 'unknown_type<void>';

// Converts bound value literals or JS-typed data value to a
// string that is valid and expected C++ literal representing that value
Handlebars.registerHelper('cppValue', (type, value) =>
  R.propOr(R.always(UNKNOWN_TYPE), type, {
    [PIN_TYPE.PULSE]: R.always('false'),
    [PIN_TYPE.BOOLEAN]: v => (v === 'True' ? 'true' : 'false'),
    [PIN_TYPE.NUMBER]: R.cond([
      [R.equals('Inf'), R.always('INFINITY')],
      [R.equals('+Inf'), R.always('INFINITY')],
      [R.equals('-Inf'), R.always('(-INFINITY)')],
      [R.equals('NaN'), R.always('NAN')],
      [R.T, R.identity],
    ]),
    [PIN_TYPE.STRING]: R.pipe(unquote, cppStringLiteral),
    [PIN_TYPE.BYTE]: cppByteLiteral,
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
    owner: R.prop('owner'),
    libName: R.prop('libName'),
    patchName: R.prop('patchName'),
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
      listViewsH,
      omitLocalIncludes(listFuncsH),
      runtimeCpp,
      impls,
      program,
    ]);
  }
);
