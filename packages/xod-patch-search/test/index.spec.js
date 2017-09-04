import R from 'ramda';
import path from 'path';
import { assert } from 'chai';
import { listPatches } from 'xod-project';
import { loadProject } from 'xod-fs';

import { createIndex, createIndexData } from '../src/index';

describe('xod-patch-search/index', () => {
  let indexData = [];
  let idx = {};
  const workspace = path.resolve(__dirname, '../../../workspace');
  const getProjectPath = projectName => path.resolve(workspace, projectName);

  before(() => loadProject(getProjectPath('welcome-to-xod'))
    .then(listPatches)
    .then(createIndexData)
    .then((iData) => {
      indexData = iData;
      idx = createIndex(indexData);
    })
  );

  it('searches by path correctly', () => {
    const result = idx.search('path:number');
    assert.equal(
      result[0].item.path,
      'xod/core/nth-number-2'
    );
  });

  it('searches by lib correctly', () => {
    const result = idx.search('lib:xod/core');
    const expectedLength = indexData.filter(item => item.lib === 'xod/core').length;
    assert.lengthOf(result, expectedLength);
  });

  it('searches: "number"', () => assert.equal(
    idx.search('number')[0].item.path,
    'xod/core/nth-number-2' // Cause it has a `number` in the path and it alphabetically sorted (that's why not *-to-string)
  ));

  it('searches: "lib:xod/patch-nodes number"', () => {
    assert.equal(
      idx.search('lib:xod/patch-nodes number')[0].item.path,
      'xod/patch-nodes/input-number' // The same as above + filtered by lib
    );
  });

  it('searches: "meter"', () => {
    const results = idx.search('meter');
    const foundPatchPaths = R.map(R.path(['item', 'path']), results);
    assert.equal(
      results[0].item.path,
      'xod/common-hardware/gp2y0a02-range-meter' // Cause this node has a full match `meter` in the `path`
    );
    assert.includeMembers(foundPatchPaths, ['xod/units/m-to-ft']); // Don't care about position, but be sure that it's found
  });

  it('searches: "temp"', () => assert.equal(
    idx.search('temp')[0].item.path,
    'xod/units/c-to-f' // Cause this node has a `temperature` in the description
  ));

  it('searches: "therm"', () => {
    const results = idx.search('therm');
    assert.equal(
      results[0].item.path,
      'xod/common-hardware/thermometer-tmp36' // Cause this node has a `thermometer` in the path and it alphabetically sorted
    );
    assert.equal(
      results[1].item.path,
      'xod/common-hardware/dht11-thermometer' // Cause this node has a `thermometer` in the path and it alphabetically sorted
    );
  });

  it('searches: "ult"', () => {
    const results = idx.search('ult');
    assert.equal(
      results[0].item.path,
      'xod/common-hardware/hc-sr04-ultrasonic-range'
    );
    assert.equal(
      results[1].item.path,
      'xod/common-hardware/hc-sr04-ultrasonic-time'
    );
    assert.equal(
      results[2].item.path,
      'xod/core/multiply'
    );
  });
});
