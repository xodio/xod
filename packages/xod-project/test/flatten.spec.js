import R from 'ramda';
import { assert } from 'chai';
import { Maybe } from 'ramda-fantasy';
import { explodeEither } from 'xod-func-tools';

import * as Helper from './helpers';
import * as Project from '../src/project';
import * as Patch from '../src/patch';
import * as Node from '../src/node';
import * as Attachment from '../src/attachment';
import * as CONST from '../src/constants';
import flatten, { extractPatches, extractLeafPatches } from '../src/flatten';
import { getCastPatchPath, getTerminalPath } from '../src/patchPathUtils';

const createImplAttachment = Attachment.createAttachmentManagedByMarker(
  CONST.NOT_IMPLEMENTED_IN_XOD_PATH
);

describe('Flatten', () => {
  describe('extractPatches', () => {
    it('correct flattening structure for trivial project', () => {
      const project = Helper.defaultizeProject({
        patches: {
          '@/main': {
            path: '@/main',
            nodes: {
              a: {
                id: 'a',
                type: 'xod/core/or',
              },
              b: {
                id: 'b',
                type: 'xod/core/or',
              },
            },
            links: {
              l: {
                id: 'l',
                output: {
                  nodeId: 'a',
                  pinKey: 'out',
                },
                input: {
                  nodeId: 'b',
                  pinKey: 'in1',
                },
              },
            },
          },
          'xod/core/or': {
            path: 'xod/core/or',
            nodes: {
              in1: {
                id: 'in1',
                position: { x: 0, y: 0 },
                type: 'xod/patch-nodes/input-boolean',
              },
              in2: {
                id: 'in2',
                position: { x: 200, y: 0 },
                type: 'xod/patch-nodes/input-boolean',
              },
              out: {
                id: 'out',
                position: { x: 0, y: 300 },
                type: 'xod/patch-nodes/output-boolean',
              },
              noNativeImpl: {
                id: 'noNativeImpl',
                position: { x: 100, y: 100 },
                type: 'xod/patch-nodes/not-implemented-in-xod',
              },
            },
            links: {},
            attachments: [createImplAttachment('// ok')],
          },
        },
      });

      const extracted = extractPatches(
        project,
        ['xod/core/or'],
        null,
        {},
        project.patches['@/main']
      );
      const result = R.map(R.map(R.unnest), extracted);

      assert.deepEqual(result, [
        [project.patches['@/main'].nodes.a, project.patches['@/main'].nodes.b],
        [project.patches['@/main'].links.l],
      ]);
    });
    it('correct flattening structure for nested project', () => {
      const project = Helper.defaultizeProject({
        patches: {
          '@/main': {
            nodes: {
              a: {
                id: 'a',
                type: '@/foo',
              },
              b: {
                id: 'b',
                type: '@/bar',
              },
              c: {
                id: 'c',
                type: 'xod/core/or',
              },
              d: {
                id: 'd',
                type: 'xod/core/or',
              },
            },
            links: {
              l: {
                id: 'l',
                output: {
                  nodeId: 'b',
                  pinKey: 'b',
                },
                input: {
                  nodeId: 'c',
                  pinKey: 'in2',
                },
              },
              l2: {
                id: 'l2',
                output: {
                  nodeId: 'd',
                  pinKey: 'out',
                },
                input: {
                  nodeId: 'c',
                  pinKey: 'in1',
                },
              },
            },
          },
          '@/foo': {
            nodes: {
              a: {
                id: 'a',
                type: 'xod/core/or',
              },
              b: {
                id: 'b',
                type: 'xod/core/or',
              },
            },
            links: {
              l: {
                id: 'l',
                output: {
                  nodeId: 'a',
                  pinKey: 'out',
                },
                input: {
                  nodeId: 'b',
                  pinKey: 'in1',
                },
              },
            },
          },
          '@/bar': {
            nodes: {
              a: {
                id: 'a',
                type: 'xod/core/or',
              },
              b: {
                id: 'b',
                type: 'xod/patch-nodes/output-boolean',
              },
              c: {
                id: 'c',
                type: '@/foo',
              },
              d: {
                id: 'd',
                type: 'xod/patch-nodes/output-boolean',
              },
            },
            links: {
              l: {
                id: 'l',
                output: {
                  nodeId: 'a',
                  pinKey: 'out',
                },
                input: {
                  nodeId: 'b',
                  pinKey: '__in__',
                },
              },
            },
          },
          'xod/core/or': {
            nodes: {
              in1: {
                id: 'in1',
                position: { x: 0, y: 0 },
                type: 'xod/patch-nodes/input-boolean',
              },
              in2: {
                id: 'in2',
                position: { x: 200, y: 0 },
                type: 'xod/patch-nodes/input-boolean',
              },
              out: {
                id: 'out',
                position: { x: 0, y: 300 },
                type: 'xod/patch-nodes/output-boolean',
              },
              noNativeImpl: {
                id: 'noNativeImpl',
                position: { x: 100, y: 100 },
                type: 'xod/patch-nodes/not-implemented-in-xod',
              },
            },
            links: {},
            attachments: [createImplAttachment('// ok')],
          },
        },
      });

      const extracted = extractPatches(
        project,
        ['xod/core/or', 'xod/patch-nodes/output-boolean'],
        null,
        {},
        project.patches['@/main']
      );

      // get only ids and types
      const nodes = R.map(
        R.compose(
          R.applySpec({
            id: R.prop('id'),
            type: R.prop('type'),
          }),
          R.unnest
        )
      )(extracted[0]);
      // unnest links
      const links = R.map(
        R.compose(
          R.applySpec({
            id: R.prop('id'),
            input: R.prop('input'),
            output: R.prop('output'),
          }),
          R.unnest
        )
      )(extracted[1]);

      assert.deepEqual(
        [nodes, links],
        [
          [
            { id: 'a~a', type: 'xod/core/or' },
            { id: 'a~b', type: 'xod/core/or' },
            { id: 'b~a', type: 'xod/core/or' },
            { id: 'b~b', type: 'xod/internal/terminal-boolean' },
            { id: 'b~c~a', type: 'xod/core/or' },
            { id: 'b~c~b', type: 'xod/core/or' },
            { id: 'b~d', type: 'xod/internal/terminal-boolean' },
            { id: 'c', type: 'xod/core/or' },
            { id: 'd', type: 'xod/core/or' },
          ],
          [
            {
              id: 'a~l',
              output: { nodeId: 'a~a', pinKey: 'out' },
              input: { nodeId: 'a~b', pinKey: 'in1' },
            },
            {
              id: 'b~c~l',
              output: { nodeId: 'b~c~a', pinKey: 'out' },
              input: { nodeId: 'b~c~b', pinKey: 'in1' },
            },
            {
              id: 'b~l',
              output: { nodeId: 'b~a', pinKey: 'out' },
              input: { nodeId: 'b~b', pinKey: '__in__' },
            },
            {
              id: 'l',
              output: { nodeId: 'b~b', pinKey: '__out__' },
              input: { nodeId: 'c', pinKey: 'in2' },
            },
            {
              id: 'l2',
              output: { nodeId: 'd', pinKey: 'out' },
              input: { nodeId: 'c', pinKey: 'in1' },
            },
          ],
        ]
      );
    });
    it('correctly pinned nodes', () => {
      const project = Helper.defaultizeProject({
        patches: {
          '@/main': {
            nodes: {
              a: {
                id: 'a',
                type: '@/foo',
                boundLiterals: {
                  a: 'true',
                },
              },
              b: {
                id: 'b',
                type: '@/foo',
              },
            },
            links: {},
          },
          '@/foo': {
            nodes: {
              a: {
                id: 'a',
                type: 'xod/patch-nodes/input-boolean',
              },
              b: {
                id: 'b',
                type: 'xod/core/number',
              },
              c: {
                id: 'c',
                type: 'xod/core/number',
                boundLiterals: {
                  in: '32',
                },
              },
            },
            links: {
              l: {
                id: 'l',
                output: { nodeId: 'a', pinKey: '__out__' },
                input: { nodeId: 'b', pinKey: 'in' },
              },
            },
          },
        },
      });

      const extracted = extractPatches(
        project,
        ['xod/patch-nodes/input-boolean', 'xod/core/number'],
        null,
        {},
        project.patches['@/main']
      );
      const result = R.map(R.map(R.unnest), extracted);
      const nodes = result[0];

      const terminalA = R.find(R.propEq('id', 'a~a'), nodes);
      assert.deepEqual(terminalA.boundLiterals, {
        __out__: 'true',
      });

      const terminalB = R.find(R.propEq('id', 'b~a'), nodes);
      assert.isEmpty(terminalB.boundLiterals);

      const justNodeWithBoundValueForPinA = R.find(
        R.propEq('id', 'a~c'),
        nodes
      );
      assert.deepEqual(
        justNodeWithBoundValueForPinA.boundLiterals,
        project.patches['@/foo'].nodes.c.boundLiterals
      );

      const justNodeWithBoundValueForPinB = R.find(
        R.propEq('id', 'b~c'),
        nodes
      );
      assert.deepEqual(
        justNodeWithBoundValueForPinB.boundLiterals,
        project.patches['@/foo'].nodes.c.boundLiterals
      );
    });
    it('correct structure for blinking.xodball', () => {
      const defaultizedBlinking = Helper.loadXodball(
        './fixtures/blinking.xodball'
      );
      const extracted = extractPatches(
        defaultizedBlinking,
        [
          'xod/core/or',
          'xod/core/digital-output',
          'xod/core/latch',
          'xod/core/clock',
          'xod/patch-nodes/input-number',
          'xod/patch-nodes/input-string',
          'xod/math/multiply',
        ],
        null,
        {},
        defaultizedBlinking.patches['@/main']
      );
      const unnested = R.map(R.map(R.unnest), extracted);
      const nodes = unnested[0];

      const terminalString = R.find(
        R.propEq('id', 'BJ4l0cVdKe~S1ulA9NuFx'),
        nodes
      );
      assert.deepEqual(terminalString.boundLiterals, {
        __out__: '"LED1"',
      });

      const terminalNumber = R.find(
        R.propEq('id', 'SJ7g05EdFe~B1eR5EOYg'),
        nodes
      );
      assert.deepEqual(terminalNumber.boundLiterals, {
        __out__: '1',
      });
    });
  });

  describe('extractLeafPatches', () => {
    it('correct Error for case if any Node refers to non-existent Patch', () => {
      const project = Helper.defaultizeProject({
        patches: {
          '@/main': {
            nodes: {
              a: { type: 'xod/test/non-existent-patch' },
            },
          },
        },
      });
      const result = extractLeafPatches(
        project,
        '@/main',
        project.patches['@/main']
      )[0];
      Helper.expectEitherError(
        'PATCH_NOT_FOUND_BY_PATH {"patchPath":"xod/test/non-existent-patch","trace":["@/main"]}',
        result
      );
    });
  });

  describe('trivial', () => {
    const project = Helper.defaultizeProject({
      patches: {
        '@/main': {
          nodes: {
            a: {
              id: 'a',
              type: 'xod/core/or',
            },
            b: {
              id: 'b',
              type: 'xod/core/or',
            },
          },
          links: {
            l: {
              id: 'l',
              output: {
                nodeId: 'a',
                pinKey: 'out',
              },
              input: {
                nodeId: 'b',
                pinKey: 'in1',
              },
            },
          },
        },
        '@/foo': {
          nodes: {
            a: {
              id: 'a',
              type: '@/empty',
            },
            b: {
              id: 'b',
              type: '@/empty',
            },
          },
        },
        '@/empty': {
          nodes: {
            noNativeImpl: {
              id: 'noNativeImpl',
              position: { x: 100, y: 100 },
              type: 'xod/patch-nodes/not-implemented-in-xod',
            },
          },
          attachments: [createImplAttachment('// ok')],
        },
        'xod/core/or': {
          nodes: {
            in1: {
              id: 'in1',
              position: { x: 0, y: 0 },
              type: 'xod/patch-nodes/input-boolean',
            },
            in2: {
              id: 'in2',
              position: { x: 200, y: 0 },
              type: 'xod/patch-nodes/input-boolean',
            },
            out: {
              id: 'out',
              position: { x: 0, y: 300 },
              type: 'xod/patch-nodes/output-boolean',
            },
            noNativeImpl: {
              id: 'noNativeImpl',
              position: { x: 100, y: 100 },
              type: 'xod/patch-nodes/not-implemented-in-xod',
            },
          },
          links: {},
          attachments: [createImplAttachment('// ok')],
        },
      },
    });
    it('should return error if implementation is not found', () => {
      const projectWithMissingAttachments = R.compose(
        explodeEither,
        Project.updatePatch('xod/core/or', Patch.setPatchAttachments([]))
      )(project);

      const flatProject = flatten(projectWithMissingAttachments, '@/main');
      Helper.expectEitherError(
        'IMPLEMENTATION_NOT_FOUND {"patchPath":"xod/core/or","trace":["@/main","xod/core/or"]}',
        flatProject
      );
    });
    it('should return patch with links', () => {
      const eitherFlatProject = flatten(project, '@/main');

      Helper.expectEitherRight(flatProject => {
        assert.sameMembers(R.keys(flatProject.patches), [
          '@/main',
          '@/foo',
          '@/empty',
          'xod/core/or',
        ]);
        assert.deepEqual(
          flatProject.patches['@/main'].links,
          project.patches['@/main'].links
        );
      }, eitherFlatProject);
    });
  });

  describe('recursive', () => {
    const project = Helper.defaultizeProject({
      patches: {
        '@/main': {
          nodes: {
            a: {
              id: 'a',
              type: '@/foo',
            },
            b: {
              id: 'b',
              type: '@/bar',
            },
            c: {
              id: 'c',
              type: 'xod/core/or',
            },
            d: {
              id: 'd',
              type: 'xod/core/or',
            },
          },
          links: {
            l: {
              id: 'l',
              output: {
                nodeId: 'b',
                pinKey: 'b',
              },
              input: {
                nodeId: 'c',
                pinKey: 'in2',
              },
            },
            l2: {
              id: 'l2',
              output: {
                nodeId: 'd',
                pinKey: 'out',
              },
              input: {
                nodeId: 'c',
                pinKey: 'in1',
              },
            },
          },
        },
        '@/foo': {
          nodes: {
            a: {
              id: 'a',
              type: 'xod/core/or',
            },
            b: {
              id: 'b',
              type: 'xod/core/or',
            },
          },
          links: {
            l: {
              id: 'l',
              output: {
                nodeId: 'a',
                pinKey: 'out',
              },
              input: {
                nodeId: 'b',
                pinKey: 'in1',
              },
            },
          },
        },
        '@/bar': {
          nodes: {
            a: {
              id: 'a',
              type: 'xod/core/or',
            },
            b: {
              id: 'b',
              type: 'xod/patch-nodes/output-boolean',
            },
            c: {
              id: 'c',
              type: '@/foo',
            },
            d: {
              id: 'd',
              type: 'xod/patch-nodes/output-boolean',
            },
          },
          links: {
            l: {
              id: 'l',
              output: {
                nodeId: 'a',
                pinKey: 'out',
              },
              input: {
                nodeId: 'b',
                pinKey: '__in__',
              },
            },
          },
        },
        'xod/core/or': {
          nodes: {
            in1: {
              id: 'in1',
              position: { x: 0, y: 0 },
              type: 'xod/patch-nodes/input-boolean',
            },
            in2: {
              id: 'in2',
              position: { x: 200, y: 0 },
              type: 'xod/patch-nodes/input-boolean',
            },
            out: {
              id: 'out',
              position: { x: 0, y: 300 },
              type: 'xod/patch-nodes/output-boolean',
            },
            noNativeImpl: {
              id: 'noNativeImpl',
              position: { x: 100, y: 100 },
              type: 'xod/patch-nodes/not-implemented-in-xod',
            },
          },
          links: {},
          attachments: [createImplAttachment('// ok')],
        },
      },
    });

    it('should modify only entry patch', () => {
      const eitherFlatProject = flatten(project, '@/main');

      Helper.expectEitherRight(flatProject => {
        assert.deepEqual(
          Project.dissocPatch('@/main', flatProject),
          Project.dissocPatch('@/main', project)
        );
      }, eitherFlatProject);
    });

    it('should return nodes with prefixed ids', () => {
      const flatProject = flatten(project, '@/main');

      Helper.expectEitherRight(newProject => {
        const maybeNode = R.compose(
          Patch.getNodeById('a~a'),
          Project.getPatchByPathUnsafe('@/main')
        )(newProject);

        assert.isTrue(Maybe.isJust(maybeNode));
      }, flatProject);
    });

    it('should remove unused terminals', () => {
      const flatProject = flatten(project, '@/main');

      Helper.expectEitherRight(newProject => {
        const maybeNode = R.compose(
          Patch.getNodeById('b~d'),
          Project.getPatchByPathUnsafe('@/main')
        )(newProject);

        Helper.expectMaybeNothing(maybeNode);
      }, flatProject);
    });

    it('should return flattened links', () => {
      const flatProject = flatten(project, '@/main');

      Helper.expectEitherRight(newProject => {
        const links = R.compose(
          Patch.listLinks,
          Project.getPatchByPathUnsafe('@/main')
        )(newProject);

        assert.lengthOf(links, 4);
      }, flatProject);
    });

    it('should correctly flatten blinking.xodball', () => {
      const blinking = Helper.loadXodball('./fixtures/blinking.xodball');
      const expected = Helper.loadXodball('./fixtures/blinking.flat.xodball');

      const eitherFlatProject = flatten(blinking, '@/main');

      Helper.expectEitherRight(
        flat => assert.deepEqual(flat, expected),
        eitherFlatProject
      );
    });

    it('should correctly flatten deeply-nested.xodball', () => {
      const deeplyNestedProject = Helper.loadXodball(
        './fixtures/deeply-nested.xodball'
      );
      const expected = Helper.loadXodball(
        './fixtures/deeply-nested.flat.xodball'
      );
      const eitherErrorOrFlat = flatten(deeplyNestedProject, '@/main');

      Helper.expectEitherRight(
        flat => assert.deepEqual(flat, expected),
        eitherErrorOrFlat
      );
    });
  });

  describe('casting nodes', () => {
    const testDiffTypes = fn => {
      // number to *
      fn(CONST.PIN_TYPE.NUMBER, CONST.PIN_TYPE.BOOLEAN);
      fn(CONST.PIN_TYPE.NUMBER, CONST.PIN_TYPE.STRING);
      // boolean to *
      fn(CONST.PIN_TYPE.BOOLEAN, CONST.PIN_TYPE.NUMBER);
      fn(CONST.PIN_TYPE.BOOLEAN, CONST.PIN_TYPE.STRING);
      fn(CONST.PIN_TYPE.BOOLEAN, CONST.PIN_TYPE.PULSE);
      // string and pulse types does not casts to anything
    };

    describe('no links to terminal', () => {
      const project = Helper.defaultizeProject({
        patches: {
          '@/main': {
            nodes: {
              a: {
                id: 'a',
                type: 'xod/core/number',
              },
              b: {
                id: 'b',
                type: 'xod/patch-nodes/output-boolean',
              },
            },
            links: {},
          },
          'xod/core/number': {
            nodes: {
              noNativeImpl: {
                id: 'noNativeImpl',
                position: { x: 100, y: 100 },
                type: 'xod/patch-nodes/not-implemented-in-xod',
              },
              out: {
                id: 'out',
                position: { x: 0, y: 300 },
                type: 'xod/patch-nodes/output-number',
              },
            },
            links: {},
            attachments: [createImplAttachment('// ok')],
          },
          'xod/core/cast-to-number(boolean)': {
            nodes: {
              __in__: {
                id: '__in__',
                position: { x: 0, y: 0 },
                type: 'xod/patch-nodes/input-boolean',
              },
              __out__: {
                id: '__out__',
                position: { x: 0, y: 300 },
                type: 'xod/patch-nodes/input-number',
              },
              noNativeImpl: {
                id: 'noNativeImpl',
                position: { x: 100, y: 100 },
                type: 'xod/patch-nodes/not-implemented-in-xod',
              },
            },
            links: {},
          },
        },
      });

      it('should return @/main without cast node and link to it', () => {
        const flatProject = flatten(project, '@/main');

        Helper.expectEitherRight(newProject => {
          const mainPatch = Project.getPatchByPathUnsafe('@/main', newProject);

          const nodeIds = R.compose(R.map(Node.getNodeId), Patch.listNodes)(
            mainPatch
          );
          assert.deepEqual(nodeIds, ['a']);

          const links = Patch.listLinks(mainPatch);
          assert.isEmpty(links);
        }, flatProject);
      });
    });

    describe('through output terminal', () => {
      const createCastOutputTest = (typeIn, typeOut) => {
        it(`${typeIn} -> ${getCastPatchPath(
          typeIn,
          typeOut
        )} -> ${typeOut}`, () => {
          const project = Helper.defaultizeProject({
            patches: {
              '@/main': {
                nodes: {
                  a: {
                    id: 'a',
                    type: '@/foo',
                  },
                  b: {
                    id: 'b',
                    type: `xod/core/${typeOut}`,
                  },
                },
                links: {
                  l: {
                    id: 'l',
                    output: {
                      nodeId: 'a',
                      pinKey: 'b',
                    },
                    input: {
                      nodeId: 'b',
                      pinKey: 'in',
                    },
                  },
                },
              },
              '@/foo': {
                nodes: {
                  a: {
                    id: 'a',
                    type: `xod/core/${typeIn}`,
                  },
                  b: {
                    id: 'b',
                    type: `xod/patch-nodes/output-${typeOut}`,
                  },
                },
                links: {
                  l: {
                    id: 'l',
                    output: {
                      nodeId: 'a',
                      pinKey: 'out',
                    },
                    input: {
                      nodeId: 'b',
                      pinKey: '__in__',
                    },
                  },
                },
              },
              [`xod/core/${typeIn}`]: {
                nodes: {
                  out: {
                    id: 'out',
                    position: { x: 0, y: 300 },
                    type: `xod/patch-nodes/output-${typeIn}`,
                  },
                  noNativeImpl: {
                    id: 'noNativeImpl',
                    position: { x: 100, y: 100 },
                    type: 'xod/patch-nodes/not-implemented-in-xod',
                  },
                },
                links: {},
                attachments: [createImplAttachment('// ok')],
              },
              [`xod/core/${typeOut}`]: {
                nodes: {
                  in: {
                    id: 'in',
                    position: { x: 0, y: 0 },
                    type: `xod/patch-nodes/input-${typeOut}`,
                  },
                  noNativeImpl: {
                    id: 'noNativeImpl',
                    position: { x: 100, y: 100 },
                    type: 'xod/patch-nodes/not-implemented-in-xod',
                  },
                },
                links: {},
                attachments: [createImplAttachment('// ok')],
              },
              [`xod/core/cast-to-${typeOut}(${typeIn})`]: {
                nodes: {
                  __in__: {
                    id: '__in__',
                    position: { x: 0, y: 0 },
                    type: `xod/patch-nodes/input-${typeIn}`,
                  },
                  __out__: {
                    id: '__out__',
                    position: { x: 0, y: 300 },
                    type: `xod/patch-nodes/input-${typeOut}`,
                  },
                  noNativeImpl: {
                    id: 'noNativeImpl',
                    position: { x: 100, y: 100 },
                    type: 'xod/patch-nodes/not-implemented-in-xod',
                  },
                },
                links: {},
              },
            },
          });

          if (typeOut === typeIn) {
            // TODO: explain what exactly is happening here
            project.patches[`xod/core/${typeOut}`].nodes = {
              in: Helper.defaultizeNode({
                id: 'in',
                position: { x: 0, y: 0 },
                type: `xod/patch-nodes/input-${typeOut}`,
              }),
              out: Helper.defaultizeNode({
                id: 'out',
                position: { x: 0, y: 300 },
                type: `xod/patch-nodes/output-${typeIn}`,
              }),
              noNativeImpl: Helper.defaultizeNode({
                id: 'noNativeImpl',
                position: { x: 100, y: 100 },
                type: 'xod/patch-nodes/not-implemented-in-xod',
              }),
            };
          }

          const flatProject = flatten(project, '@/main');
          const expectedPath = `xod/core/cast-to-${typeOut}(${typeIn})`; // getCastPatchPath(typeIn, typeOut);

          Helper.expectEitherRight(newProject => {
            assert.deepEqual(
              Project.getPatchByPathUnsafe(expectedPath, newProject),
              Project.getPatchByPathUnsafe(expectedPath, project)
            );
          }, flatProject);
        });
      };
      testDiffTypes(createCastOutputTest);
    });

    describe('through input terminal', () => {
      const createCastInputTest = (typeIn, typeOut) => {
        it(`${typeIn} -> ${getCastPatchPath(
          typeIn,
          typeOut
        )} -> ${typeOut}`, () => {
          const project = Helper.defaultizeProject({
            patches: {
              '@/main': {
                nodes: {
                  a: {
                    id: 'a',
                    type: `xod/core/${typeIn}`,
                  },
                  foo: {
                    id: 'foo',
                    type: '@/foo',
                  },
                },
                links: {
                  l: {
                    id: 'l',
                    output: {
                      nodeId: 'a',
                      pinKey: 'out',
                    },
                    input: {
                      nodeId: 'foo',
                      pinKey: 'b',
                    },
                  },
                },
              },
              '@/foo': {
                nodes: {
                  a: {
                    id: 'a',
                    type: `xod/core/${typeOut}`,
                  },
                  b: {
                    id: 'b',
                    type: `xod/patch-nodes/input-${typeOut}`,
                  },
                },
                links: {
                  l: {
                    id: 'l',
                    output: {
                      nodeId: 'b',
                      pinKey: '__out__',
                    },
                    input: {
                      nodeId: 'a',
                      pinKey: 'in',
                    },
                  },
                },
              },
              [`xod/core/${typeOut}`]: {
                nodes: {
                  in: {
                    id: 'in',
                    position: { x: 0, y: 0 },
                    type: `xod/patch-nodes/input-${typeOut}`,
                  },
                  noNativeImpl: {
                    id: 'noNativeImpl',
                    position: { x: 100, y: 100 },
                    type: 'xod/patch-nodes/not-implemented-in-xod',
                  },
                },
                links: {},
                attachments: [createImplAttachment('// ok')],
              },
              [`xod/core/${typeIn}`]: {
                nodes: {
                  out: {
                    id: 'out',
                    position: { x: 0, y: 0 },
                    type: `xod/patch-nodes/output-${typeIn}`,
                  },
                  noNativeImpl: {
                    id: 'noNativeImpl',
                    position: { x: 100, y: 100 },
                    type: 'xod/patch-nodes/not-implemented-in-xod',
                  },
                },
                links: {},
                attachments: [createImplAttachment('// ok')],
              },
              [`xod/core/cast-to-${typeOut}(${typeIn})`]: {
                nodes: {
                  __in__: {
                    id: '__in__',
                    position: { x: 0, y: 0 },
                    type: `xod/patch-nodes/input-${typeIn}`,
                  },
                  __out__: {
                    id: '__out__',
                    position: { x: 0, y: 300 },
                    type: `xod/patch-nodes/input-${typeOut}`,
                  },
                  noNativeImpl: {
                    id: 'noNativeImpl',
                    position: { x: 100, y: 100 },
                    type: 'xod/patch-nodes/not-implemented-in-xod',
                  },
                },
                links: {},
              },
            },
          });

          if (typeOut === typeIn) {
            project.patches[`xod/core/${typeOut}`].nodes = {
              in: Helper.defaultizeNode({
                id: 'in',
                position: { x: 0, y: 0 },
                type: `xod/patch-nodes/input-${typeOut}`,
              }),
              out: Helper.defaultizeNode({
                id: 'out',
                position: { x: 0, y: 300 },
                type: `xod/patch-nodes/output-${typeIn}`,
              }),
              noNativeImpl: Helper.defaultizeNode({
                id: 'noNativeImpl',
                position: { x: 100, y: 100 },
                type: 'xod/patch-nodes/not-implemented-in-xod',
              }),
            };
          }

          const flatProject = flatten(project, '@/main');
          const expectedPath = `xod/core/cast-to-${typeOut}(${typeIn})`; // getCastPatchPath(typeIn, typeOut);

          Helper.expectEitherRight(newProject => {
            assert.deepEqual(
              Project.getPatchByPathUnsafe(expectedPath, newProject),
              Project.getPatchByPathUnsafe(expectedPath, project)
            );
          }, flatProject);
        });
      };
      testDiffTypes(createCastInputTest);
    });

    // TODO: Write test:
    //       it should remove terminal, link and there should be no casting nodes
    //       E.G. [Number]---[output-bool] --> [Number]
    describe('one link to terminal', () => {});

    // TODO: Write test:
    //       it should replace terminal with two casting nodes and three links
    //       E.G. [Number]---[output-bool]---[String] -->
    //        --> [Number]---[cast-number-to-boolean]---[cast-boolean-to-string]---[String]
    describe('three different types', () => {});

    describe('with same types', () => {
      const project = Helper.defaultizeProject({
        patches: {
          '@/main': {
            nodes: {
              a: {
                id: 'a',
                type: '@/foo',
              },
              b: {
                id: 'b',
                type: 'xod/core/number',
              },
            },
            links: {
              l: {
                id: 'l',
                output: {
                  nodeId: 'a',
                  pinKey: 'b',
                },
                input: {
                  nodeId: 'b',
                  pinKey: 'in',
                },
              },
            },
          },
          '@/foo': {
            nodes: {
              a: {
                id: 'a',
                type: 'xod/core/number',
              },
              b: {
                id: 'b',
                type: 'xod/patch-nodes/output-number',
              },
            },
            links: {
              l: {
                id: 'l',
                output: {
                  nodeId: 'a',
                  pinKey: 'out',
                },
                input: {
                  nodeId: 'b',
                  pinKey: '__in__',
                },
              },
            },
          },
          'xod/core/number': {
            nodes: {
              in: {
                id: 'in',
                position: { x: 0, y: 0 },
                type: 'xod/patch-nodes/input-number',
              },
              noNativeImpl: {
                id: 'noNativeImpl',
                position: { x: 100, y: 100 },
                type: 'xod/patch-nodes/not-implemented-in-xod',
              },
              out: {
                id: 'out',
                position: { x: 0, y: 300 },
                type: 'xod/patch-nodes/output-number',
              },
            },
            links: {},
            attachments: [createImplAttachment('// ok')],
          },
        },
      });

      it('should return two flattened nodes', () => {
        const flatProject = flatten(project, '@/main');

        Helper.expectEitherRight(newProject => {
          const nodeIds = R.compose(
            R.map(Node.getNodeId),
            Patch.listNodes,
            Project.getPatchByPathUnsafe('@/main')
          )(newProject);

          assert.sameMembers(nodeIds, ['a~a', 'b']);
        }, flatProject);
      });

      it('should return one flattened links', () => {
        const flatProject = flatten(project, '@/main');

        Helper.expectEitherRight(newProject => {
          const actualLinks = R.compose(
            Patch.listLinks,
            Project.getPatchByPathUnsafe('@/main')
          )(newProject);

          assert.deepEqual(actualLinks, [
            Helper.defaultizeLink({
              id: 'l',
              input: {
                nodeId: 'b',
                pinKey: 'in',
              },
              output: {
                nodeId: 'a~a',
                pinKey: 'out',
              },
            }),
          ]);
        }, flatProject);
      });
    });

    describe('needed, but missing in the project', () => {
      const project = Helper.defaultizeProject({
        patches: {
          '@/main': {
            nodes: {
              a: {
                id: 'a',
                type: 'xod/core/or',
              },
              b: {
                id: 'b',
                type: 'xod/patch-nodes/output-number',
              },
            },
            links: {
              l: {
                id: 'l',
                output: {
                  nodeId: 'a',
                  pinKey: 'out',
                },
                input: {
                  nodeId: 'b',
                  pinKey: '__in__',
                },
              },
            },
          },
          'xod/core/or': {
            nodes: {
              in1: {
                id: 'in1',
                position: { x: 0, y: 0 },
                type: 'xod/patch-nodes/input-boolean',
              },
              in2: {
                id: 'in2',
                position: { x: 200, y: 0 },
                type: 'xod/patch-nodes/input-boolean',
              },
              out: {
                id: 'out',
                position: { x: 0, y: 300 },
                type: 'xod/patch-nodes/output-boolean',
              },
              noNativeImpl: {
                id: 'noNativeImpl',
                position: { x: 100, y: 100 },
                type: 'xod/patch-nodes/not-implemented-in-xod',
              },
            },
            links: {},
            attachments: [createImplAttachment('// ok')],
          },
        },
      });

      it('should return Either.Left Error', () => {
        const flatProject = flatten(project, '@/main');

        Helper.expectEitherError(
          'DEAD_REFERENCE__PATCH_FOR_NODE_NOT_FOUND {"nodeType":"xod/core/cast-to-number(boolean)","patchPath":"@/untitled-patch","trace":["@/untitled-patch"]}',
          flatProject
        );
      });
    });

    describe('multiple outputs from patch', () => {
      //  +----------------+
      //  |                |
      //  +---NUM----NUM---+
      //       |      |
      //       |      |
      //  +---STR----STR---+
      //  |                |
      //  +----------------+
      //
      it('should create a separate cast node for each casted output', () => {
        const inputProject = Helper.loadXodball(
          './fixtures/cast-multiple-outputs.xodball'
        );
        const expectedProject = Helper.loadXodball(
          './fixtures/cast-multiple-outputs.flat.xodball'
        );
        const eitherFlatProject = flatten(inputProject, '@/main');

        Helper.expectEitherRight(
          actualProject => assert.deepEqual(actualProject, expectedProject),
          eitherFlatProject
        );
      });
    });
  });

  describe('bound values', () => {
    it('should return original (unnested) nodes with bound values', () => {
      const project = Helper.defaultizeProject({
        patches: {
          '@/main': {
            nodes: {
              f: {
                id: 'f',
                type: '@/foo',
                boundLiterals: {
                  b: '32',
                },
              },
            },
            links: {},
          },
          '@/foo': {
            nodes: {
              a: {
                id: 'a',
                type: 'xod/core/number',
              },
              b: {
                id: 'b',
                type: 'xod/patch-nodes/input-number',
              },
            },
            links: {
              l: {
                id: 'l',
                output: {
                  nodeId: 'b',
                  pinKey: '__out__',
                },
                input: {
                  nodeId: 'a',
                  pinKey: 'in',
                },
              },
            },
          },
          'xod/core/number': {
            nodes: {
              in: {
                id: 'in',
                position: { x: 0, y: 0 },
                type: 'xod/patch-nodes/input-number',
              },
              noNativeImpl: {
                id: 'noNativeImpl',
                position: { x: 100, y: 100 },
                type: 'xod/patch-nodes/not-implemented-in-xod',
              },
              out: {
                id: 'out',
                position: { x: 0, y: 300 },
                type: 'xod/patch-nodes/output-number',
              },
            },
            links: {},
            attachments: [createImplAttachment('// ok')],
          },
        },
      });

      const flatProject = flatten(project, '@/main');

      Helper.expectEitherRight(newProject => {
        const maybeActualBoundValue = R.compose(
          Node.getBoundValue('in'),
          Patch.getNodeByIdUnsafe('f~a'),
          Project.getPatchByPathUnsafe('@/main')
        )(newProject);

        const maybeExpectedBoundValue = R.compose(
          Node.getBoundValue('b'),
          Patch.getNodeByIdUnsafe('f'),
          Project.getPatchByPathUnsafe('@/main')
        )(project);

        assert.deepEqual(maybeActualBoundValue, maybeExpectedBoundValue);
      }, flatProject);
    });
    it('should return cast-nodes with bound values', () => {
      const project = Helper.defaultizeProject({
        patches: {
          '@/main': {
            nodes: {
              a: {
                id: 'a',
                type: 'xod/core/or',
              },
              b: {
                id: 'b',
                type: '@/foo',
                boundLiterals: {
                  a2: '32',
                  a3: '27',
                },
              },
              c: {
                id: 'c',
                type: 'xod/core/or',
              },
            },
            links: {
              l: {
                id: 'l',
                output: {
                  nodeId: 'a',
                  pinKey: 'out',
                },
                input: {
                  nodeId: 'b',
                  pinKey: 'a',
                },
              },
              l2: {
                id: 'l2',
                output: {
                  nodeId: 'b',
                  pinKey: 'c',
                },
                input: {
                  nodeId: 'c',
                  pinKey: 'in1',
                },
              },
            },
          },
          '@/foo': {
            nodes: {
              a: {
                id: 'a',
                type: 'xod/patch-nodes/input-number',
              },
              a2: {
                id: 'a2',
                type: 'xod/patch-nodes/input-number',
              },
              a3: {
                id: 'a3',
                type: 'xod/patch-nodes/input-number',
              },
              b: {
                id: 'b',
                type: 'xod/core/or',
              },
              b2: {
                id: 'b2',
                type: 'xod/core/or',
              },
              c: {
                id: 'c',
                type: 'xod/patch-nodes/output-boolean',
              },
            },
            links: {
              l: {
                id: 'l',
                output: {
                  nodeId: 'a',
                  pinKey: '__out__',
                },
                input: {
                  nodeId: 'b',
                  pinKey: 'in1',
                },
              },
              l2: {
                id: 'l2',
                output: {
                  nodeId: 'a2',
                  pinKey: '__out__',
                },
                input: {
                  nodeId: 'b',
                  pinKey: 'in2',
                },
              },
              l3: {
                id: 'l3',
                output: {
                  nodeId: 'a3',
                  pinKey: '__out__',
                },
                input: {
                  nodeId: 'b2',
                  pinKey: 'in2',
                },
              },
              l4: {
                id: 'l4',
                output: {
                  nodeId: 'b',
                  pinKey: 'out',
                },
                input: {
                  nodeId: 'c',
                  pinKey: '__in__',
                },
              },
            },
          },
          'xod/core/or': {
            nodes: {
              in1: {
                id: 'in1',
                position: { x: 0, y: 0 },
                type: 'xod/patch-nodes/input-boolean',
              },
              in2: {
                id: 'in2',
                position: { x: 200, y: 0 },
                type: 'xod/patch-nodes/input-boolean',
              },
              out: {
                id: 'out',
                position: { x: 0, y: 300 },
                type: 'xod/patch-nodes/output-boolean',
              },
              noNativeImpl: {
                id: 'noNativeImpl',
                position: { x: 100, y: 100 },
                type: 'xod/patch-nodes/not-implemented-in-xod',
              },
            },
            links: {},
            attachments: [createImplAttachment('// ok')],
          },
          'xod/core/cast-to-number(boolean)': {
            nodes: {
              __in__: {
                id: '__in__',
                position: { x: 0, y: 0 },
                type: 'xod/patch-nodes/input-boolean',
              },
              __out__: {
                id: '__out__',
                position: { x: 0, y: 300 },
                type: 'xod/patch-nodes/input-number',
              },
              noNativeImpl: {
                id: 'noNativeImpl',
                position: { x: 100, y: 100 },
                type: 'xod/patch-nodes/not-implemented-in-xod',
              },
            },
            links: {},
            attachments: [createImplAttachment('// ok')],
          },
          'xod/core/cast-to-boolean(number)': {
            nodes: {
              __in__: {
                id: '__in__',
                position: { x: 0, y: 0 },
                type: 'xod/patch-nodes/input-number',
              },
              __out__: {
                id: '__out__',
                position: { x: 0, y: 300 },
                type: 'xod/patch-nodes/input-boolean',
              },
              noNativeImpl: {
                id: 'noNativeImpl',
                position: { x: 100, y: 100 },
                type: 'xod/patch-nodes/not-implemented-in-xod',
              },
            },
            links: {},
            attachments: [createImplAttachment('// ok')],
          },
        },
      });
      const flatProject = flatten(project, '@/main');

      Helper.expectEitherRight(newProject => {
        const maybeActualBoundValue = R.compose(
          Node.getBoundValue('__in__'),
          Patch.getNodeByIdUnsafe('b~a2-to-b~b-pin-in2'),
          Project.getPatchByPathUnsafe('@/main')
        )(newProject);
        const maybeExpectedBoundValue = R.compose(
          Node.getBoundValue('a2'),
          Patch.getNodeByIdUnsafe('b'),
          Project.getPatchByPathUnsafe('@/main')
        )(project);
        assert.deepEqual(maybeActualBoundValue, maybeExpectedBoundValue);

        const maybeActualBoundValue2 = R.compose(
          Node.getBoundValue('__in__'),
          Patch.getNodeByIdUnsafe('b~a3-to-b~b2-pin-in2'),
          Project.getPatchByPathUnsafe('@/main')
        )(newProject);
        const maybeExpectedBoundValue2 = R.compose(
          Node.getBoundValue('a3'),
          Patch.getNodeByIdUnsafe('b'),
          Project.getPatchByPathUnsafe('@/main')
        )(project);
        assert.deepEqual(maybeActualBoundValue2, maybeExpectedBoundValue2);
      }, flatProject);
    });
    it('should return flat project with correct bound values', () => {
      const project = Helper.defaultizeProject({
        patches: {
          '@/main': {
            nodes: {
              f: {
                type: '@/foo',
                boundLiterals: {
                  out: '42',
                },
              },
              m: {
                type: 'xod/core/multiply',
                boundLiterals: {
                  in1: '26',
                },
              },
            },
            links: {
              l: {
                output: {
                  nodeId: 'f',
                  pinKey: 'out',
                },
                input: {
                  nodeId: 'm',
                  pinKey: 'in2',
                },
              },
            },
          },
          '@/foo': {
            nodes: {
              out: {
                label: 'FOO',
                type: 'xod/patch-nodes/output-number',
              },
            },
          },
          'xod/core/multiply': {
            nodes: {
              in1: {
                type: 'xod/patch-nodes/input-number',
              },
              in2: {
                type: 'xod/patch-nodes/input-number',
              },
              noNativeImpl: {
                type: 'xod/patch-nodes/not-implemented-in-xod',
              },
              out: {
                type: 'xod/patch-nodes/output-number',
              },
            },
            attachments: [createImplAttachment('// ok')],
          },
        },
      });
      const flatProject = flatten(project, '@/main');
      Helper.expectEitherRight(newProject => {
        const actualBoundValues = R.compose(
          Node.getAllBoundValues,
          Patch.getNodeByIdUnsafe('m'),
          Project.getPatchByPathUnsafe('@/main')
        )(newProject);

        assert.deepEqual(actualBoundValues, {
          in1: '26',
          in2: '42',
        });
      }, flatProject);
    });

    it('should propagate bound values to nested patches', () => {
      const project = Helper.loadXodball(
        './fixtures/bound-input-values-propagation.xodball'
      );
      const expectedProject = Helper.loadXodball(
        './fixtures/bound-input-values-propagation.flat.xodball'
      );
      const flatProject = flatten(project, '@/main');

      Helper.expectEitherRight(
        proj => assert.deepEqual(proj, expectedProject),
        flatProject
      );
    });

    it('should propagate bound values to DEEPLY nested patches', () => {
      const inputProject = Helper.loadXodball(
        './fixtures/deep-bound-values-propagation.xodball'
      );
      const expectedProject = Helper.loadXodball(
        './fixtures/deep-bound-values-propagation.flat.xodball'
      );
      const flatProject = flatten(inputProject, '@/main');

      Helper.expectEitherRight(
        project => assert.deepEqual(project, expectedProject),
        flatProject
      );
    });
    it('should not override already bound outputs when propagating values upwards', () => {
      const inputProject = Helper.loadXodball(
        './fixtures/bound-values-propagation-to-busy-output.xodball'
      );
      const expectedProject = Helper.loadXodball(
        './fixtures/bound-values-propagation-to-busy-output.flat.xodball'
      );
      const flatProject = flatten(inputProject, '@/main');

      Helper.expectEitherRight(
        project => assert.deepEqual(project, expectedProject),
        flatProject
      );
    });
    it('should allow constant node values to propagate down', () => {
      const inputProject = Helper.loadXodball(
        './fixtures/constant-propagation-through-bound-output.xodball'
      );
      const expectedProject = Helper.loadXodball(
        './fixtures/constant-propagation-through-bound-output.flat.xodball'
      );
      const flatProject = flatten(inputProject, '@/main');

      Helper.expectEitherRight(project => {
        assert.deepEqual(project, expectedProject);
      }, flatProject);
    });
  });

  describe('implementations', () => {
    const project = Helper.defaultizeProject({
      patches: {
        '@/main': {
          nodes: {
            a: {
              id: 'a',
              type: 'xod/core/or',
            },
            b: {
              id: 'b',
              type: 'xod/core/and',
            },
          },
        },
        '@/references-patch-without-impl': {
          nodes: {
            a: {
              id: 'a',
              type: '@/no-impl',
            },
            b: {
              id: 'b',
              type: 'xod/core/and',
            },
          },
        },
        '@/no-impl': {
          nodes: {
            noNativeImpl: {
              id: 'noNativeImpl',
              position: { x: 100, y: 100 },
              type: 'xod/patch-nodes/not-implemented-in-xod',
            },
          },
        },
        'xod/core/or': {
          nodes: {
            noNativeImpl: {
              id: 'noNativeImpl',
              position: { x: 100, y: 100 },
              type: 'xod/patch-nodes/not-implemented-in-xod',
            },
          },
          attachments: [createImplAttachment('// ok')],
        },
        'xod/core/and': {
          nodes: {
            noNativeImpl: {
              id: 'noNativeImpl',
              position: { x: 100, y: 100 },
              type: 'xod/patch-nodes/not-implemented-in-xod',
            },
          },
          attachments: [createImplAttachment('// ok')],
        },
      },
    });

    describe('single', () => {
      it('defined implementation exists', () => {
        const flatProject = flatten(project, '@/main');

        Helper.expectEitherRight(newProject => {
          assert.deepEqual(
            Project.getPatchByPathUnsafe('@/main', newProject),
            Project.getPatchByPathUnsafe('@/main', project)
          );
        }, flatProject);
      });
      it('no defined implementation in the project', () => {
        const flatProject = flatten(project, '@/references-patch-without-impl');
        Helper.expectEitherError(
          'IMPLEMENTATION_NOT_FOUND {"patchPath":"@/no-impl","trace":["@/references-patch-without-impl","@/no-impl"]}',
          flatProject
        );
      });
    });
    describe('patch not implemented in xod as an entry point', () => {
      it('should not be accepted', () => {
        const flatProject = flatten(project, 'xod/core/or');
        Helper.expectEitherError(
          'CPP_AS_ENTRY_POINT {"patchPath":"xod/core/or"}',
          flatProject
        );
      });
    });
  });

  describe('abstract patches', () => {
    const project = Helper.defaultizeProject({
      patches: {
        '@/main': {
          nodes: {
            a: {
              type: '@/abstract',
            },
          },
        },
        '@/abstract': {
          nodes: {
            a: {
              type: CONST.ABSTRACT_MARKER_PATH,
            },
            b: {
              type: getTerminalPath(
                CONST.PIN_DIRECTION.INPUT,
                CONST.PIN_TYPE.T1
              ),
            },
          },
        },
      },
    });

    it('should not accept abstract patches as an entry point', () => {
      const flatProject = flatten(project, '@/abstract');
      Helper.expectEitherError(
        'ABSTRACT_AS_ENTRY_POINT {"patchPath":"@/abstract"}',
        flatProject
      );
    });
  });
});
