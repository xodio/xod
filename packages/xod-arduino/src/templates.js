import R from 'ramda';
import Handlebars from 'handlebars';
import handlebarsDelimiters from 'handlebars-delimiters';

import { def } from './types';

import configTpl from '../platform/configuration.tpl.cpp';
import generatedCodeTpl from '../platform/generatedCode.tpl.cpp';
import implListTpl from '../platform/implList.tpl.cpp';
import programTpl from '../platform/program.tpl.cpp';

import runtime from '../platform/runtime.cpp';

// Replace delimiters from {{ }} to <% %>
handlebarsDelimiters(Handlebars, ['<%', '%>']);

// =============================================================================
//
// Utils and helpers
//
// =============================================================================
const indexByPinKey = R.indexBy(R.prop('pinKey'));
const getPatchPins = direction => R.compose(
  indexByPinKey,
  R.path(['patch', direction])
);
const getNodePins = direction => R.compose(
  indexByPinKey,
  R.prop(direction)
);
const mergeAndListPins = (direction, node) => R.compose(
  R.values,
  R.converge(
    R.mergeWith(R.merge),
    [
      getPatchPins(direction),
      getNodePins(direction),
    ]
  )
)(node);
// Merge patch pins data with node pins data
Handlebars.registerHelper('mergePins', function mergePins() {
  this.inputs = mergeAndListPins('inputs', this);
  this.outputs = mergeAndListPins('outputs', this);
});
// Check that variable is not undefined
Handlebars.registerHelper('exists', function existsHelper(variable, options) {
  return (typeof variable !== 'undefined') ?
    options.fn(this) :
    options.inverse(this);
});

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
  generatedCode: Handlebars.compile(generatedCodeTpl, renderingOptions),
  implList: Handlebars.compile(implListTpl, renderingOptions),
  program: Handlebars.compile(programTpl, renderingOptions),
};

// =============================================================================
//
// Rendering functions
//
// =============================================================================
// :: TConfig -> String
export const renderConfig = def(
  'renderConfig :: TConfig -> String',
  templates.config
);
// :: TPatch -> String
export const renderGeneratedCode = def(
  'renderGeneratedCode :: TPatch -> String',
  templates.generatedCode
);
// :: TPatch -> String
export const renderImpl = def(
  'renderImpl :: TPatch -> String',
  (data) => {
    const patchImpl = R.prop('impl', data);
    const generatedCode = templates.generatedCode(data);
    return Handlebars.compile(patchImpl, renderingOptions)({ GENERATED_CODE: generatedCode });
  }
);
// :: TPatch[] -> String
export const renderImplList = def(
  'renderImplList :: [TPatch] -> String',
  R.compose(
    templates.implList,
    R.map(
      R.applySpec({
        owner: R.prop('owner'),
        libName: R.prop('libName'),
        patchName: R.prop('patchName'),
        implementation: renderImpl,
      })
    )
  )
);
// :: TNode[] -> String
export const renderProgram = def(
  'renderProgram :: [TNode] -> String',
  templates.program
);

// :: TProject -> String
export const renderProject = def(
  'renderProject :: TProject -> String',
  (project) => {
    const config = renderConfig(project.config);
    const impls = renderImplList(project.patches);
    const program = renderProgram(project.nodes);

    return R.join('\n')([
      config,
      runtime,
      impls,
      program,
    ]);
  }
);
