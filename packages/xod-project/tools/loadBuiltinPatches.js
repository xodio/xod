const fs = require('fs');
const path = require('path');
const R = require('ramda');

const { explodeEither } = require('xod-func-tools');
const XP = require('..');

const targetPath = path.resolve(__dirname, '../dist/built-in-patches.json');
const xodballPath = path.resolve(__dirname, '../built-in-patches.xodball');

// generate terminal patches programmatically
// in case some are missing in a xodball
// (for example, when adding a new type)
const terminalPatches = R.compose(
  R.indexBy(XP.getPatchPath),
  R.map(patchPath => R.pipe(XP.createPatch, XP.setPatchPath(patchPath))())
)(XP.BUILT_IN_TERMINAL_PATCH_PATHS);

const nonTerminalPatches = R.compose(
  R.indexBy(XP.getPatchPath),
  R.map(
    R.over(
      R.lens(XP.getPatchPath, XP.setPatchPath),
      R.replace('@', 'xod/patch-nodes')
    )
  ),
  XP.listLocalPatches,
  explodeEither,
  XP.fromXodball,
  p => fs.readFileSync(p, 'utf8')
)(xodballPath);

const json = JSON.stringify(
  R.merge(terminalPatches, nonTerminalPatches),
  null,
  2
);
fs.writeFileSync(targetPath, json);
process.exit(0);
