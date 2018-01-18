// @flow

import * as R from 'ramda';
import type { UnaryFn, CurriedFunction2, CurriedFunction3 } from 'ramda';

import * as XF from 'xod-func-tools';

type CppCode = string;
type PragmaTokens = Array<string>;
type Pragmas = Array<PragmaTokens>;

// ((?!\/\/).)*? matches lines without // before /*
// [\s\S]* matches anything across lines
// See: https://stackoverflow.com/questions/1068280/javascript-regex-multiline-flag-doesnt-work
// [\s\S]*? is to reduce regex greedieness
const stripBlockComments: UnaryFn<CppCode, CppCode> =
  R.replace(/^(((?!\/\/).)*?)\s*\/\*[\s\S]*?\*\//gm, '$1');

const stripLineComments: UnaryFn<CppCode, CppCode> =
  R.replace(/\s*\/\/.*$/gm, '');

const stripCppComments: UnaryFn<CppCode, CppCode> =
  R.compose(
    stripLineComments,
    stripBlockComments
  );

const pragmaHeadRegexp = /#\s*pragma\s+XOD\s+/;
const pragmaLineRegexp = new RegExp(`${pragmaHeadRegexp.source}.*`, 'g');

const tokenizePragma: UnaryFn<string, PragmaTokens> =
  R.compose(
    R.map(R.replace(/^"|"$/g, '')), // strip enclosing quotes
    R.match(/[\w._-]+|"[^"]+"/g), // match identifier or string
    R.replace(pragmaHeadRegexp, ''), // remove leading #pragma XOD
  );

const findXodPragmas: UnaryFn<CppCode, Pragmas> =
  R.compose(
    R.map(tokenizePragma),
    R.match(pragmaLineRegexp),
    stripCppComments
  );

const doesReferSymbol: CurriedFunction2<string, CppCode, boolean> =
  R.curry((symbol, code: CppCode) => R.compose(
    R.test(new RegExp(`\\b${symbol}\\b`)),
    stripCppComments
  )(code));

const doesReferTemplateSymbol: CurriedFunction3<string, string, CppCode, boolean> =
  R.curry((symbol, templateArg, code: CppCode) => R.compose(
    R.test(new RegExp(`\\b${symbol}\\s*\\<\\s*${templateArg}\\s*\\>`)),
    stripCppComments
  )(code));

const filterPragmasByFeature: CurriedFunction2<string, Pragmas, Pragmas> =
  R.curry((feat, pragmas: Pragmas) =>
    pragmas.filter(R.compose(
      R.equals(feat),
      R.head
    ))
  );

// Returns whether a particular #pragma feature enabled, disabled, or set to auto.
// Default is auto
const pragmaEndis: CurriedFunction2<string, CppCode, 'enable' | 'disable' | 'auto'> =
  R.curry((feature: string, code: CppCode) => R.compose(
    state => ((state === 'enable' || state === 'disable') ? state : 'auto'),
    R.nth(1),
    R.defaultTo([]),
    R.last,
    filterPragmasByFeature(feature),
    findXodPragmas,
  )(code));

const pragmaTimeouts = pragmaEndis('timeouts');
const pragmaNodeId = pragmaEndis('nodeid');

const nthToken: CurriedFunction2<number, PragmaTokens, string> =
  R.curry((n, pragma: PragmaTokens) => R.nth(n, pragma) || '');

const endisToBoolean: CurriedFunction2<boolean, string, boolean> =
  R.curry((defaultR, endis: string) => {
    switch (endis) {
      case 'enable': return true;
      case 'disable': return false;
      default: return defaultR;
    }
  });

const isDirtienessRelatedTo: CurriedFunction2<string, PragmaTokens, boolean> =
  R.curry((identifier, pragma: PragmaTokens) => R.compose(
    XF.isAmong([identifier, '']),
    nthToken(2),
  )(pragma));

const isOutput: UnaryFn<string, boolean> =
  R.test(/^output_/);

export const areTimeoutsEnabled: UnaryFn<CppCode, boolean> =
  code => R.compose(
    endisToBoolean(doesReferSymbol('setTimeout', code)),
    pragmaTimeouts
  )(code);

export const isNodeIdEnabled: UnaryFn<CppCode, boolean> =
  code => R.compose(
    endisToBoolean(doesReferSymbol('getNodeId', code)),
    pragmaNodeId
  )(code);

export const isDirtienessEnabled: CurriedFunction2<CppCode, string, boolean> =
  R.curry((code, identifier: string) => R.compose(
    R.reduce(
      (acc, pragma) =>
        (isDirtienessRelatedTo(identifier, pragma)
          ? endisToBoolean(acc, nthToken(1, pragma))
          : acc),
      isOutput(identifier) || /* dirtieness enabled on outputs by default */
        doesReferTemplateSymbol('isInputDirty', identifier, code)
    ),
    filterPragmasByFeature('dirtieness'),
    findXodPragmas,
  )(code));

export const forUnitTests = {
  stripCppComments,
  findXodPragmas,
};
