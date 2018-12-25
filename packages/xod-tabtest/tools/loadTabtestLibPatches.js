const fs = require('fs');
const path = require('path');
const R = require('ramda');

const XP = require('xod-project');
const { loadProject } = require('xod-fs');

const pathToTabtestLib = path.resolve(
  __dirname,
  '../workspace/__lib__/xod/tabtest'
);
const targetPath = path.resolve(__dirname, '../lib/tabtestLibPatches.json');

loadProject([], pathToTabtestLib).then(project => {
  const tabtestLibPatches = R.compose(
    R.map(
      R.over(
        R.lens(XP.getPatchPath, XP.setPatchPath),
        R.replace('@', 'xod/tabtest')
      )
    ),
    XP.listLocalPatches
  )(project);

  const json = JSON.stringify(tabtestLibPatches, null, 2);
  fs.writeFileSync(targetPath, json);
  process.exit(0);
});
