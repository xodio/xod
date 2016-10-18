// Transformer script that transforms old-fashioned meta into new patch meta

// Rel path from this script to lib directory.
// Don't forget to change it if you move this file!
const relPathToLibDirectory = '../../../../xod-workspace/lib/';

// Before run script:
// $ npm i ramda require-json5
// Then just run it:
// $ node patch-workspace.js
// Don't forget to remove packages that required only in this script:
// $ npm r ramda require-json5

const R = require('ramda');
const requireJSON5 = require('require-json5');
const path = require('path');
const fs = require('fs');
const recReadDir = require('recursive-readdir');

const { getInitialState, PIN_DIRECTION } = require('xod-core');

const removeNils = R.reject(R.isNil);

const mapDirectedNodeTypePins = (direction, collectionKey) => R.compose(
  R.indexBy(R.prop('key')),
  R.addIndex(R.map)((io, index) => R.merge({ index, direction }, io)),
  R.propOr([], collectionKey)
);

const mapNodeTypePins = meta => R.merge(
  mapDirectedNodeTypePins(PIN_DIRECTION.INPUT, 'inputs')(meta),
  mapDirectedNodeTypePins(PIN_DIRECTION.OUTPUT, 'outputs')(meta)
);

const patchWorkspaceLibs = (pathToLibDir) => {
  recReadDir(pathToLibDir, (err, files) => {
    const metas = files.filter(
      filename => path.extname(filename) === '.xodm'
    );

    metas.forEach((meta) => {
      const js = requireJSON5(meta);
      const rel = path.relative(pathToLibDir, meta);
      const id = ((rel) => {
        const parts = rel.split('/');
        parts.pop();
        return parts.join('/');
      })(rel);

      const nodetype = R.merge(
        R.omit(['inputs', 'outputs'], js),
        {
          pins: mapNodeTypePins(js),
        }
      );
      const json = JSON.stringify(nodetype, null, 2);

      fs.writeFile(`${meta}`, json, 'utf8', (err, data) => {
        if (err) throw err;
        console.log(meta, 'saved');
      });
    });
  });
};

patchWorkspaceLibs(path.resolve(__dirname, relPathToLibDirectory));
