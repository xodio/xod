import * as R from 'ramda';
import { assert } from 'chai';
import { defaultizeProject } from 'xod-project/test/helpers';

import { getTableLogSourceLabels } from '../src/debugger/utils';

const TABLE_LOG_NODES = {
  'xod/debug/tsv-log': {},
  'xod/debug/table-log': {
    nodes: {
      log: {
        type: 'xod/debug/tsv-log',
      },
    },
  },
};

describe('generate labels for table log sources', () => {
  const assertSameSources = (project, rootPatchPath, expectedLabelsForIds) => {
    const ids = R.keys(expectedLabelsForIds);
    const result = getTableLogSourceLabels(project, ids, rootPatchPath);
    const expectedResult = R.compose(
      R.map(
        R.applySpec({
          nodeId: R.nth(0),
          label: R.nth(1),
        })
      ),
      R.toPairs
    )(expectedLabelsForIds);
    assert.deepEqual(result, expectedResult);
  };

  it('should contain `DELETED (nodeId)` for a source that not exists in the patch', () => {
    const project = defaultizeProject({
      patches: {
        '@/main': {},
        ...TABLE_LOG_NODES,
      },
    });

    assertSameSources(project, '@/main', {
      'a~n~t~log': '@/main > DELETED (a~n~t~log)',
      t: '@/main > DELETED (t)',
    });
  });
  it('should contain node type base names if the node is unlabeled', () => {
    const project = defaultizeProject({
      patches: {
        '@/main': {
          nodes: {
            a: {
              type: '@/nested-1',
            },
            b: {
              type: '@/nested-2',
            },
            t: {
              type: 'xod/debug/table-log',
            },
          },
        },
        '@/nested-1': {
          nodes: {
            n: {
              type: '@/nested-2',
            },
          },
        },
        '@/nested-2': {
          nodes: {
            t: {
              type: 'xod/debug/table-log',
            },
          },
        },
        ...TABLE_LOG_NODES,
      },
    });

    assertSameSources(project, '@/main', {
      'a~n~t~log': '@/main > nested-1 > nested-2 > table-log',
      'b~t~log': '@/main > nested-2 > table-log',
      't~log': '@/main > table-log',
    });
  });
  it('should contain node labels if it is set', () => {
    const project = defaultizeProject({
      patches: {
        '@/main': {
          nodes: {
            a: {
              type: '@/nested-1',
              label: 'Nested One',
            },
            b: {
              type: '@/nested-2',
              label: 'Nested Two',
            },
            c: {
              type: '@/nested-label',
              label: 'Nested Label',
            },
            t: {
              type: 'xod/debug/table-log',
              label: 'My Table Log',
            },
          },
        },
        '@/nested-1': {
          nodes: {
            n: {
              type: '@/nested-2',
            },
          },
        },
        '@/nested-2': {
          nodes: {
            t: {
              type: 'xod/debug/table-log',
            },
          },
        },
        '@/nested-label': {
          nodes: {
            n: {
              type: '@/nested-2',
              label: 'Log',
            },
          },
        },
        ...TABLE_LOG_NODES,
      },
    });

    assertSameSources(project, '@/main', {
      'a~n~t~log': '@/main > Nested One > nested-2 > table-log',
      'b~t~log': '@/main > Nested Two > table-log',
      'c~n~t~log': '@/main > Nested Label > Log > table-log',
      't~log': '@/main > My Table Log',
    });
  });
  it('should add numbers to the duplicates on a correct nesting level', () => {
    const project = defaultizeProject({
      patches: {
        '@/main': {
          nodes: {
            a: {
              type: '@/nested-1',
              label: 'Nested',
            },
            a2: {
              type: '@/nested-1',
              label: 'Nested',
            },
            a3: {
              type: '@/nested-1',
            },
            b: {
              type: '@/nested-label',
            },
            b2: {
              type: '@/nested-label',
            },
            d: {
              type: '@/nested-double',
            },
            d2: {
              type: '@/nested-double',
            },
            d3: {
              type: '@/nested-double',
              label: 'Double Inside',
            },
            nc: {
              type: '@/nested-complex',
            },
            nc2: {
              type: '@/nested-complex',
            },
            t: {
              type: 'xod/debug/table-log',
              label: 'My Table Log',
            },
            t2: {
              type: 'xod/debug/table-log',
              label: 'My Table Log',
            },
            t3: {
              type: 'xod/debug/table-log',
              label: 'My Table Log',
            },
          },
        },
        '@/nested-1': {
          nodes: {
            n: {
              type: '@/nested-2',
            },
          },
        },
        '@/nested-2': {
          nodes: {
            t: {
              type: 'xod/debug/table-log',
            },
          },
        },
        '@/nested-label': {
          nodes: {
            n: {
              type: '@/nested-2',
              label: 'Log',
            },
          },
        },
        '@/nested-double': {
          nodes: {
            t: { type: 'xod/debug/table-log' },
            t2: { type: 'xod/debug/table-log' },
          },
        },
        '@/nested-complex': {
          nodes: {
            n: { type: '@/nested-1' },
            n2: { type: '@/nested-1' },
            nn: { type: '@/nested-2' },
            nn2: { type: '@/nested-2' },
            nd: { type: '@/nested-double' },
            nd2: { type: '@/nested-double' },
          },
        },
        ...TABLE_LOG_NODES,
      },
    });

    assertSameSources(project, '@/main', {
      'a~n~t~log': '@/main > Nested > nested-2 > table-log',
      'a2~n~t~log': '@/main > Nested #2 > nested-2 > table-log',
      'a3~n~t~log': '@/main > nested-1 > nested-2 > table-log',
      'b~n~t~log': '@/main > nested-label > Log > table-log',
      'b2~n~t~log': '@/main > nested-label #2 > Log > table-log',
      'd~t~log': '@/main > nested-double > table-log',
      'd~t2~log': '@/main > nested-double > table-log #2',
      'd2~t~log': '@/main > nested-double #2 > table-log',
      'd2~t2~log': '@/main > nested-double #2 > table-log #2',
      'd3~t~log': '@/main > Double Inside > table-log',
      'd3~t2~log': '@/main > Double Inside > table-log #2',
      'nc~n~n~t~log':
        '@/main > nested-complex > nested-1 > nested-2 > table-log',
      'nc~n2~n~t~log':
        '@/main > nested-complex > nested-1 #2 > nested-2 > table-log',
      'nc~nn~t~log': '@/main > nested-complex > nested-2 > table-log',
      'nc~nn2~t~log': '@/main > nested-complex > nested-2 #2 > table-log',
      'nc~nd~t~log': '@/main > nested-complex > nested-double > table-log',
      'nc~nd~t2~log': '@/main > nested-complex > nested-double > table-log #2',
      'nc~nd2~t~log': '@/main > nested-complex > nested-double #2 > table-log',
      'nc~nd2~t2~log':
        '@/main > nested-complex > nested-double #2 > table-log #2',
      'nc2~n~n~t~log':
        '@/main > nested-complex #2 > nested-1 > nested-2 > table-log',
      'nc2~n2~n~t~log':
        '@/main > nested-complex #2 > nested-1 #2 > nested-2 > table-log',
      'nc2~nn~t~log': '@/main > nested-complex #2 > nested-2 > table-log',
      'nc2~nn2~t~log': '@/main > nested-complex #2 > nested-2 #2 > table-log',
      'nc2~nd~t~log': '@/main > nested-complex #2 > nested-double > table-log',
      'nc2~nd~t2~log':
        '@/main > nested-complex #2 > nested-double > table-log #2',
      'nc2~nd2~t~log':
        '@/main > nested-complex #2 > nested-double #2 > table-log',
      'nc2~nd2~t2~log':
        '@/main > nested-complex #2 > nested-double #2 > table-log #2',
      't~log': '@/main > My Table Log',
      't2~log': '@/main > My Table Log #2',
      't3~log': '@/main > My Table Log #3',
    });
  });
});
