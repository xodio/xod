import R from 'ramda';
import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import { explodeEither } from 'xod-func-tools';

import * as Helper from './helpers';
import * as Project from '../src/project';
import * as Patch from '../src/patch';
import * as Attachment from '../src/attachment';
import * as CONST from '../src/constants';
import flatten, { extractPatches, extractLeafPatches } from '../src/flatten';
import { formatString } from '../src/utils';
import { getCastPatchPath, getTerminalPath } from '../src/patchPathUtils';

chai.use(dirtyChai);

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
            attachments: [Attachment.createImplAttachment('// ok')],
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

      expect(result).to.be.deep.equal([
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
            attachments: [Attachment.createImplAttachment('// ok')],
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

      expect([nodes, links]).to.be.deep.equal([
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
      ]);
    });
    it('correctly pinned nodes', () => {
      const project = Helper.defaultizeProject({
        patches: {
          '@/main': {
            nodes: {
              a: {
                id: 'a',
                type: '@/foo',
                boundValues: {
                  a: true,
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
                boundValues: {
                  in: 32,
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
      expect(terminalA)
        .to.have.property('boundValues')
        .that.deep.equals({
          __out__: true,
        });

      const terminalB = R.find(R.propEq('id', 'b~a'), nodes);
      expect(terminalB)
        .to.have.property('boundValues')
        .that.empty();

      const justNodeWithBoundValueForPinA = R.find(
        R.propEq('id', 'a~c'),
        nodes
      );
      expect(justNodeWithBoundValueForPinA)
        .to.have.property('boundValues')
        .that.deep.equals(project.patches['@/foo'].nodes.c.boundValues);

      const justNodeWithBoundValueForPinB = R.find(
        R.propEq('id', 'b~c'),
        nodes
      );
      expect(justNodeWithBoundValueForPinB)
        .to.have.property('boundValues')
        .that.deep.equals(project.patches['@/foo'].nodes.c.boundValues);
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
      expect(terminalString)
        .to.have.property('boundValues')
        .that.deep.equals({
          __out__: 'LED1',
        });

      const terminalNumber = R.find(
        R.propEq('id', 'SJ7g05EdFe~B1eR5EOYg'),
        nodes
      );
      expect(terminalNumber)
        .to.have.property('boundValues')
        .that.deep.equals({
          __out__: 1,
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
        formatString(CONST.ERROR.PATCH_NOT_FOUND_BY_PATH, {
          patchPath: 'xod/test/non-existent-patch',
        }),
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
          attachments: [Attachment.createImplAttachment('// ok')],
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
          attachments: [Attachment.createImplAttachment('// ok')],
        },
      },
    });
    it('should return error if implementation not found', () => {
      const projectWithMissingAttachments = R.compose(
        explodeEither,
        Project.updatePatch('xod/core/or', Patch.setPatchAttachments([]))
      )(project);

      const flatProject = flatten(projectWithMissingAttachments, '@/main');
      Helper.expectEitherError(
        formatString(CONST.ERROR.IMPLEMENTATION_NOT_FOUND, {
          patchPath: 'xod/core/or',
        }),
        flatProject
      );
    });
    it('should ignore not referred patches', () => {
      const flatProject = flatten(project, '@/foo');

      Helper.expectEitherRight(newProject => {
        expect(R.keys(newProject.patches)).to.be.deep.equal([
          '@/empty',
          '@/foo',
        ]);
        expect(newProject.patches['@/foo']).to.be.deep.equal(
          project.patches['@/foo']
        );
      }, flatProject);
    });
    it('should return patch and its dependencies', () => {
      const flatProject = flatten(project, '@/main');

      Helper.expectEitherRight(newProject => {
        expect(R.keys(newProject.patches)).to.be.deep.equal([
          'xod/core/or',
          '@/main',
        ]);
        expect(newProject.patches['@/main'].nodes).to.be.deep.equal(
          project.patches['@/main'].nodes
        );
      }, flatProject);
    });
    it('should return patch with links', () => {
      const flatProject = flatten(project, '@/main');

      Helper.expectEitherRight(newProject => {
        expect(R.keys(newProject.patches)).to.be.deep.equal([
          'xod/core/or',
          '@/main',
        ]);
        expect(newProject.patches['@/main'].links).to.be.deep.equal(
          project.patches['@/main'].links
        );
      }, flatProject);
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
          attachments: [Attachment.createImplAttachment('// ok')],
        },
      },
    });

    it('should ignore not referred patches', () => {
      const flatProject = flatten(project, '@/foo');

      Helper.expectEitherRight(newProject => {
        expect(R.keys(newProject.patches)).to.be.deep.equal([
          'xod/core/or',
          '@/foo',
        ]);
        expect(newProject.patches['xod/core/or']).to.be.deep.equal(
          project.patches['xod/core/or']
        );
        expect(newProject.patches['@/foo'].nodes).to.be.deep.equal(
          project.patches['@/foo'].nodes
        );
      }, flatProject);
    });

    it('should return patch and its dependencies', () => {
      const flatProject = flatten(project, '@/main');

      Helper.expectEitherRight(newProject => {
        expect(R.keys(newProject.patches)).to.be.deep.equal([
          'xod/core/or',
          '@/main',
        ]);
        expect(newProject.patches['xod/core/or']).to.be.deep.equal(
          project.patches['xod/core/or']
        );
        expect(R.values(newProject.patches['@/main'].nodes)[0])
          .to.have.property('type')
          .that.equals('xod/core/or');
      }, flatProject);
    });

    it('should return nodes with prefixed ids', () => {
      const flatProject = flatten(project, '@/main');

      Helper.expectEitherRight(newProject => {
        expect(R.keys(newProject.patches)).to.be.deep.equal([
          'xod/core/or',
          '@/main',
        ]);
        expect(newProject.patches['xod/core/or']).to.be.deep.equal(
          project.patches['xod/core/or']
        );
        expect(R.values(newProject.patches['@/main'].nodes)[0])
          .to.have.property('id')
          .that.equal('a~a');
      }, flatProject);
    });

    it('should remove unused terminals', () => {
      const flatProject = flatten(project, '@/main');

      Helper.expectEitherRight(newProject => {
        expect(newProject.patches['@/main'].nodes).to.have.not.property('b~d');
      }, flatProject);
    });

    it('should return flattened links', () => {
      const flatProject = flatten(project, '@/main');

      Helper.expectEitherRight(newProject => {
        expect(R.keys(newProject.patches)).to.be.deep.equal([
          'xod/core/or',
          '@/main',
        ]);
        expect(R.values(newProject.patches['@/main'].links)).to.have.lengthOf(
          4
        );
      }, flatProject);
    });

    it('should correctly flatten blinking.xodball', () => {
      const blinking = Helper.loadXodball('./fixtures/blinking.xodball');
      const blinkingFlat = Helper.loadXodball(
        './fixtures/blinking.flat.xodball'
      );
      const flattened = R.unnest(flatten(blinking, '@/main'));
      expect(flattened).to.deep.equal(blinkingFlat);
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
        flat => expect(flat).to.be.deep.equal(expected),
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
            attachments: [Attachment.createImplAttachment('// ok')],
          },
          'xod/core/cast-boolean-to-number': {
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

      it('should return patches without cast patch', () => {
        const flatProject = flatten(project, '@/main');
        Helper.expectEitherRight(newProject => {
          expect(R.keys(newProject.patches)).to.be.deep.equal([
            'xod/core/number',
            '@/main',
          ]);
        }, flatProject);
      });

      it('should return @/main without cast node and link to it', () => {
        const flatProject = flatten(project, '@/main');

        Helper.expectEitherRight(newProject => {
          expect(R.keys(newProject.patches['@/main'].nodes)).to.be.deep.equal([
            'a',
          ]);
          expect(R.values(newProject.patches['@/main'].links)).to.have.lengthOf(
            0
          );
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
                attachments: [Attachment.createImplAttachment('// ok')],
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
                attachments: [Attachment.createImplAttachment('// ok')],
              },
              [`xod/core/cast-${typeIn}-to-${typeOut}`]: {
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
          const expectedPath = `xod/core/cast-${typeIn}-to-${typeOut}`; // getCastPatchPath(typeIn, typeOut);
          const expectedPaths =
            typeIn === typeOut
              ? [`xod/core/${typeIn}`, expectedPath, '@/main']
              : [
                  `xod/core/${typeIn}`,
                  `xod/core/${typeOut}`,
                  expectedPath,
                  '@/main',
                ];

          Helper.expectEitherRight(newProject => {
            expect(R.keys(newProject.patches)).to.be.deep.equal(expectedPaths);
            expect(newProject.patches[expectedPath]).to.be.deep.equal(
              project.patches[expectedPath]
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
                attachments: [Attachment.createImplAttachment('// ok')],
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
                attachments: [Attachment.createImplAttachment('// ok')],
              },
              [`xod/core/cast-${typeIn}-to-${typeOut}`]: {
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
          const expectedPath = `xod/core/cast-${typeIn}-to-${typeOut}`; // getCastPatchPath(typeIn, typeOut);
          const expectedPaths =
            typeIn === typeOut
              ? [`xod/core/${typeIn}`, expectedPath, '@/main']
              : [
                  `xod/core/${typeIn}`,
                  `xod/core/${typeOut}`,
                  expectedPath,
                  '@/main',
                ];

          Helper.expectEitherRight(newProject => {
            expect(R.keys(newProject.patches)).to.be.deep.equal(expectedPaths);
            expect(newProject.patches[expectedPath]).to.be.deep.equal(
              project.patches[expectedPath]
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
            attachments: [Attachment.createImplAttachment('// ok')],
          },
        },
      });

      it('should return patches without cast patch', () => {
        const flatProject = flatten(project, '@/main');

        Helper.expectEitherRight(newProject => {
          expect(R.keys(newProject.patches)).to.be.deep.equal([
            'xod/core/number',
            '@/main',
          ]);
        }, flatProject);
      });

      it('should return two flattened nodes', () => {
        const flatProject = flatten(project, '@/main');

        Helper.expectEitherRight(newProject => {
          expect(R.keys(newProject.patches['@/main'].nodes)).to.be.deep.equal([
            'a~a',
            'b',
          ]);
        }, flatProject);
      });

      it('should return one flattened links', () => {
        const flatProject = flatten(project, '@/main');

        Helper.expectEitherRight(newProject => {
          expect(R.values(newProject.patches['@/main'].links))
            .to.have.lengthOf(1)
            .and.have.property(0)
            .that.deep.equal({
              '@@type': 'xod-project/Link',
              id: 'l',
              input: {
                nodeId: 'b',
                pinKey: 'in',
              },
              output: {
                nodeId: 'a~a',
                pinKey: 'out',
              },
            });
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
            attachments: [Attachment.createImplAttachment('// ok')],
          },
        },
      });

      it(`should return Either.Left with error "${
        CONST.ERROR.CAST_PATCH_NOT_FOUND
      }"`, () => {
        const flatProject = flatten(project, '@/main');

        Helper.expectEitherError(
          formatString(CONST.ERROR.CAST_PATCH_NOT_FOUND, {
            patchPath: 'xod/core/cast-boolean-to-number',
          }),
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
        const flatProject = flatten(inputProject, '@/main');

        Helper.expectEitherRight(
          flat => expect(flat).to.deep.equal(expectedProject),
          flatProject
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
                boundValues: {
                  b: 32,
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
            attachments: [Attachment.createImplAttachment('// ok')],
          },
        },
      });

      const flatProject = flatten(project, '@/main');

      Helper.expectEitherRight(newProject => {
        expect(newProject.patches['@/main'].nodes['f~a'])
          .to.have.property('boundValues')
          .that.have.property('in')
          .that.equal(project.patches['@/main'].nodes.f.boundValues.b);
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
                boundValues: {
                  a2: 32,
                  a3: 27,
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
            attachments: [Attachment.createImplAttachment('// ok')],
          },
          'xod/core/cast-boolean-to-number': {
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
            attachments: [Attachment.createImplAttachment('// ok')],
          },
          'xod/core/cast-number-to-boolean': {
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
            attachments: [Attachment.createImplAttachment('// ok')],
          },
        },
      });
      const flatProject = flatten(project, '@/main');

      Helper.expectEitherRight(newProject => {
        expect(newProject.patches['@/main'].nodes['b~a2-to-b~b-pin-in2'])
          .to.have.property('boundValues')
          .that.have.property('__in__')
          .that.equal(project.patches['@/main'].nodes.b.boundValues.a2);
        expect(newProject.patches['@/main'].nodes['b~a3-to-b~b2-pin-in2'])
          .to.have.property('boundValues')
          .that.have.property('__in__')
          .that.equal(project.patches['@/main'].nodes.b.boundValues.a3);
      }, flatProject);
    });
    it('should return flat project with correct bound values', () => {
      const project = Helper.defaultizeProject({
        patches: {
          '@/main': {
            nodes: {
              f: {
                type: '@/foo',
                boundValues: {
                  out: 42,
                },
              },
              m: {
                type: 'xod/core/multiply',
                boundValues: {
                  in1: 26,
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
            attachments: [Attachment.createImplAttachment('// ok')],
          },
        },
      });
      const flatProject = flatten(project, '@/main');
      Helper.expectEitherRight(newProject => {
        const node = newProject.patches['@/main'].nodes.m;
        expect(node.boundValues).to.deep.equal({
          in1: 26,
          in2: 42,
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
        proj => expect(proj).to.deep.equal(expectedProject),
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
        project => expect(project).to.deep.equal(expectedProject),
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
        project => expect(project).to.deep.equal(expectedProject),
        flatProject
      );
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
          attachments: [Attachment.createImplAttachment('// ok')],
        },
        'xod/core/and': {
          nodes: {
            noNativeImpl: {
              id: 'noNativeImpl',
              position: { x: 100, y: 100 },
              type: 'xod/patch-nodes/not-implemented-in-xod',
            },
          },
          attachments: [Attachment.createImplAttachment('// ok')],
        },
      },
    });

    describe('single', () => {
      it('defined implementation exists', () => {
        const flatProject = flatten(project, '@/main');

        Helper.expectEitherRight(newProject => {
          expect(newProject.patches['@/main']).to.be.deep.equal(
            project.patches['@/main']
          );
        }, flatProject);
      });
      it('no defined implementation in the project', () => {
        const flatProject = flatten(project, '@/references-patch-without-impl');
        Helper.expectEitherError(
          formatString(CONST.ERROR.IMPLEMENTATION_NOT_FOUND, {
            patchPath: '@/no-impl',
          }),
          flatProject
        );
      });
    });
    describe('patch not implemented in xod as an entry point', () => {
      it('should not be accepted', () => {
        const flatProject = flatten(project, 'xod/core/or');
        Helper.expectEitherError(CONST.ERROR.CPP_AS_ENTRY_POINT, flatProject);
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
        CONST.ERROR.ABSTRACT_AS_ENTRY_POINT,
        flatProject
      );
    });

    it('should not allow unresolved abstract patches', () => {
      const flatProject = flatten(project, '@/main');
      Helper.expectEitherError(
        CONST.ERROR.ALL_TYPES_MUST_BE_RESOLVED,
        flatProject
      );
    });
  });
});
