import R from 'ramda';
import path from 'path';
import { assert } from 'chai';
import { listPatches } from 'xod-project';
import { loadProject } from 'xod-fs';

import { createPatchSearcher, createIndexData } from '../src/index';

const workspace = path.resolve(__dirname, '../../../workspace');
const getProjectPath = projectName => path.resolve(workspace, projectName);
const fixture = p => path.resolve(__dirname, './fixtures/', p);

describe('xod-patch-search/index', () => {
  describe('general search', () => {
    let indexData = [];
    let search = {};
    before(() =>
      loadProject([workspace], getProjectPath('welcome-to-xod'))
        .then(listPatches)
        .then(createIndexData)
        .then(iData => {
          indexData = iData;
          search = createPatchSearcher();
        })
    );

    it('searches by path correctly', () => {
      const result = search(indexData, 'path:number');
      assert.equal(result[0].item.path, 'xod/core/nth-number');
    });

    it('searches by lib correctly', () => {
      const result = search(indexData, 'lib:xod/core');
      const expectedLength = R.compose(
        R.length,
        // We have to reject patches with path contains "(",
        // cause we're not showing specialization nodes if
        // query does not contain "(" symbol
        R.reject(R.propSatisfies(R.contains('('), 'path')),
        R.filter(R.propEq('lib', 'xod/core'))
      )(indexData);
      assert.lengthOf(result, expectedLength);
    });

    it('searches: "number"', () =>
      assert.equal(
        search(indexData, 'number')[0].item.path,
        'xod/bits/number-to-f32'
      ));

    it('searches: "lib:xod/patch-nodes pulse"', () => {
      assert.equal(
        search(indexData, 'lib:xod/patch-nodes pulse')[0].item.path,
        'xod/patch-nodes/output-pulse' // The same as above + filtered by lib
      );
    });

    it('searches: "meter"', () => {
      const results = search(indexData, 'meter');
      const foundPatchPaths = R.map(R.path(['item', 'path']), results);
      assert.equal(
        results[0].item.path,
        'xod-dev/sharp-irm/gp2y0a02-range-meter' // Cause this node has a full match `meter` in the `path`
      );
      assert.includeMembers(foundPatchPaths, ['xod/units/m-to-ft']); // Don't care about position, but be sure that it's found
    });

    it('searches: "temp"', () =>
      assert.equal(
        search(indexData, 'temp')[0].item.path,
        'xod/units/c-to-f' // Cause this node has a `temperature` in the description
      ));

    it('searches: "therm"', () => {
      const results = search(indexData, 'therm');
      assert.equal(
        results[0].item.path,
        'xod/common-hardware/thermometer-tmp36'
      );
      assert.equal(results[1].item.path, '@/109-thermometer');
      assert.equal(
        results[2].item.path,
        'xod/common-hardware/dht11-thermometer'
      );
    });

    it('searches: "ult"', () => {
      const results = search(indexData, 'ult');
      assert.equal(
        results[0].item.path,
        'xod/common-hardware/hc-sr04-ultrasonic-range'
      );
      assert.equal(
        results[1].item.path,
        'xod/common-hardware/hc-sr04-ultrasonic-time'
      );
      assert.equal(results[2].item.path, 'xod/core/multiply');
    });
  });

  describe('abstract nodes and specializations', () => {
    let indexData = [];
    let search = {};
    before(() =>
      loadProject([workspace], fixture('abstract-and-specializations.xodball'))
        .then(listPatches)
        .then(createIndexData)
        .then(iData => {
          indexData = iData;
          search = createPatchSearcher();
        })
    );
    it('searches abstract node "when-either-ch" and doesn\'t show specialization nodes', () => {
      const results = search(indexData, 'when-either-ch');
      const patchPaths = R.map(R.path(['item', 'path']), results);

      assert.equal(results[0].item.path, '@/when-either-changes');
      assert.isFalse(
        R.contains('@/when-either-changes(number,string)', patchPaths)
      );
      assert.isFalse(
        R.contains('@/when-either-changes(number,boolean)', patchPaths)
      );
    });
    it('searches all specialization nodes for "when-either-ch("', () => {
      const results = search(indexData, 'when-either-ch(');
      const patchPaths = R.map(R.path(['item', 'path']), results);

      assert.isFalse(R.contains('@/when-either-changes', patchPaths));
      assert.isTrue(
        R.contains('@/when-either-changes(number,string)', patchPaths)
      );
      assert.isTrue(
        R.contains('@/when-either-changes(number,boolean)', patchPaths)
      );
    });
    it('searches both specialization nodes for "when-either-ch(mber"', () => {
      const results = search(indexData, 'when-either-ch(mber');
      const patchPaths = R.map(R.path(['item', 'path']), results);
      const specializations = R.take(2, patchPaths);

      assert.isFalse(R.contains('@/when-either-changes', patchPaths));
      assert.sameMembers(
        [
          '@/when-either-changes(number,string)',
          '@/when-either-changes(number,boolean)',
        ],
        specializations
      );
    });
    it('searches one specialization node for "when-(tr"', () => {
      const results = search(indexData, 'when-(tr');

      assert.equal(
        results[0].item.path,
        '@/when-either-changes(number,string)'
      );
    });
    it('searches one specialization node for "when-either-ch(ring"', () => {
      const results = search(indexData, 'when-either-ch(ring');
      const patchPaths = R.map(R.path(['item', 'path']), results);

      assert.equal(
        results[0].item.path,
        '@/when-either-changes(number,string)'
      );
      assert.isFalse(R.contains('@/when-either-changes', patchPaths));
    });
    it('searches one specialization node for "when-either-ch(number,boolean)"', () => {
      const results = search(indexData, 'when-either-ch(number,boolean)');

      assert.equal(
        results[0].item.path,
        '@/when-either-changes(number,boolean)'
      );
    });
    it('searches no specialization node for "when-either-ch(pulse)"', () => {
      const results = search(indexData, 'when-either-ch(pulse)');

      assert.lengthOf(results, 0);
    });
  });
});
