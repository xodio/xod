import R from 'ramda';
import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';

import * as Helper from './helpers';
import * as CONST from '../src/constants';
import flatten, { extractPatches, extractLeafPatches } from '../src/flatten';
import { formatString } from '../src/utils';
import { getCastPatchPath } from '../src/patchPathUtils';
import { fromXodballDataUnsafe } from '../src/xodball';

import blinking from './fixtures/blinking.json';
import blinkingFlat from './fixtures/blinking.flat.json';

import deeplyNested from './fixtures/deeply-nested.json';
import deeplyNestedFlat from './fixtures/deeply-nested.flat.json';

import boundInputValuesPropagation from './fixtures/bound-input-values-propagation.json';
import boundInputValuesPropagationFlat from './fixtures/bound-input-values-propagation.flat.json';

import castMultipleOutputsXodball from './fixtures/cast-multiple-outputs.xodball.json';
import castMultipleOutputsFlat from './fixtures/cast-multiple-outputs.flat.json';

import deepBoundValuesPropagationXodball from './fixtures/deep-bound-values-propagation.xodball.json';
import deepBoundValuesPropagationFlat from './fixtures/deep-bound-values-propagation.flat.json';

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
            impls: {
              js: '//ok',
            },
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
            impls: {
              js: '//ok',
            },
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
          __in__: true,
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
    it('correct structure for blinking.json', () => {
      const defaultizedBlinking = Helper.defaultizeProject(blinking);
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
          __in__: 'LED1',
        });

      const terminalNumber = R.find(
        R.propEq('id', 'SJ7g05EdFe~B1eR5EOYg'),
        nodes
      );
      expect(terminalNumber)
        .to.have.property('boundValues')
        .that.deep.equals({
          __in__: 1,
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
        ['js'],
        project,
        '@/main',
        project.patches['@/main']
      )[0];
      expect(result.isLeft).to.be.true();
      Helper.expectErrorMessage(
        msg =>
          expect(msg).to.be.equal(
            formatString(CONST.ERROR.PATCH_NOT_FOUND_BY_PATH, {
              patchPath: 'xod/test/non-existent-patch',
            })
          ),
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
          impls: {
            js: '//ok',
          },
        },
      },
    });
    it('should return error if implementation not found', () => {
      const flatProject = flatten(project, '@/main', ['cpp']);
      expect(flatProject.isLeft).to.be.true();
      Helper.expectErrorMessage(
        expect,
        flatProject,
        formatString(CONST.ERROR.IMPLEMENTATION_NOT_FOUND, {
          impl: 'cpp',
          patchPath: 'xod/core/or',
        })
      );
    });
    it('should ignore not referred patches', () => {
      const flatProject = flatten(project, 'xod/core/or', ['js']);

      expect(flatProject.isRight).to.be.true();
      Helper.expectEither(newProject => {
        expect(R.keys(newProject.patches)).to.be.deep.equal(['xod/core/or']);
        expect(newProject.patches['xod/core/or']).to.be.deep.equal(
          project.patches['xod/core/or']
        );
      }, flatProject);
    });
    it('should return patch and its dependencies', () => {
      const flatProject = flatten(project, '@/main', ['js']);

      expect(flatProject.isRight).to.be.true();
      Helper.expectEither(newProject => {
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
      const flatProject = flatten(project, '@/main', ['js']);

      expect(flatProject.isRight).to.be.true();
      Helper.expectEither(newProject => {
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
          impls: {
            js: '//ok',
          },
        },
      },
    });

    it('should ignore not referred patches', () => {
      const flatProject = flatten(project, '@/foo', ['js']);

      expect(flatProject.isRight).to.be.true();
      Helper.expectEither(newProject => {
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
      const flatProject = flatten(project, '@/main', ['js']);

      expect(flatProject.isRight).to.be.true();
      Helper.expectEither(newProject => {
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
      const flatProject = flatten(project, '@/main', ['js']);

      expect(flatProject.isRight).to.be.true();
      Helper.expectEither(newProject => {
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
      const flatProject = flatten(project, '@/main', ['js']);

      expect(flatProject.isRight).to.be.true();
      Helper.expectEither(newProject => {
        expect(newProject.patches['@/main'].nodes).to.have.not.property('b~d');
      }, flatProject);
    });

    it('should return flattened links', () => {
      const flatProject = flatten(project, '@/main', ['js']);

      expect(flatProject.isRight).to.be.true();
      Helper.expectEither(newProject => {
        expect(R.keys(newProject.patches)).to.be.deep.equal([
          'xod/core/or',
          '@/main',
        ]);
        expect(R.values(newProject.patches['@/main'].links)).to.have.lengthOf(
          4
        );
      }, flatProject);
    });

    it('should correctly flatten blinking.json', () => {
      const defaultizedBlinking = Helper.defaultizeProject(blinking);
      const flattened = R.unnest(
        flatten(defaultizedBlinking, '@/main', ['espruino', 'js'])
      );
      expect(flattened).to.deep.equal(blinkingFlat);
    });

    it('should correctly flatten deeply-nested.json', () => {
      const eitherErrorOrFlat = flatten(deeplyNested, '@/main', [
        'arduino',
        'cpp',
      ]);

      expect(eitherErrorOrFlat.isRight).to.be.true();

      Helper.expectEither(flat => {
        expect(flat).to.be.deep.equal(deeplyNestedFlat);
      }, eitherErrorOrFlat);
    });
  });

  describe('casting nodes', () => {
    const testDiffTypes = fn => {
      // number to *
      fn(CONST.PIN_TYPE.NUMBER, CONST.PIN_TYPE.BOOLEAN);
      fn(CONST.PIN_TYPE.NUMBER, CONST.PIN_TYPE.STRING);
      fn(CONST.PIN_TYPE.NUMBER, CONST.PIN_TYPE.PULSE);
      // boolean to *
      fn(CONST.PIN_TYPE.BOOLEAN, CONST.PIN_TYPE.NUMBER);
      fn(CONST.PIN_TYPE.BOOLEAN, CONST.PIN_TYPE.STRING);
      fn(CONST.PIN_TYPE.BOOLEAN, CONST.PIN_TYPE.PULSE);
      // string to *
      fn(CONST.PIN_TYPE.STRING, CONST.PIN_TYPE.BOOLEAN);
      fn(CONST.PIN_TYPE.STRING, CONST.PIN_TYPE.PULSE);
      // pulse to *
      fn(CONST.PIN_TYPE.PULSE, CONST.PIN_TYPE.NUMBER);
      fn(CONST.PIN_TYPE.PULSE, CONST.PIN_TYPE.BOOLEAN);
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
            impls: {
              js: '//OK',
            },
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
            impls: {},
          },
        },
      });

      it('should return patches without cast patch', () => {
        const flatProject = flatten(project, '@/main', ['js']);
        expect(flatProject.isRight).to.be.true();
        Helper.expectEither(newProject => {
          expect(R.keys(newProject.patches)).to.be.deep.equal([
            'xod/core/number',
            '@/main',
          ]);
        }, flatProject);
      });

      it('should return @/main without cast node and link to it', () => {
        const flatProject = flatten(project, '@/main', ['js']);

        expect(flatProject.isRight).to.be.true();
        Helper.expectEither(newProject => {
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
        it(`${typeIn} -> ${getCastPatchPath(typeIn, typeOut)} -> ${
          typeOut
        }`, () => {
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
                impls: {
                  js: '//OK',
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
                impls: {
                  js: '//OK',
                },
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
                impls: {},
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

          const flatProject = flatten(project, '@/main', ['js']);
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

          expect(flatProject.isRight).to.be.true();
          Helper.expectEither(newProject => {
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
        it(`${typeIn} -> ${getCastPatchPath(typeIn, typeOut)} -> ${
          typeOut
        }`, () => {
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
                impls: {
                  js: '//OK',
                },
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
                impls: {
                  js: '//OK',
                },
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
                impls: {},
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

          const flatProject = flatten(project, '@/main', ['js']);
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

          expect(flatProject.isRight).to.be.true();
          Helper.expectEither(newProject => {
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
            impls: {
              js: '//OK',
            },
          },
        },
      });

      it('should return patches without cast patch', () => {
        const flatProject = flatten(project, '@/main', ['js']);

        expect(flatProject.isRight).to.be.true();
        Helper.expectEither(newProject => {
          expect(R.keys(newProject.patches)).to.be.deep.equal([
            'xod/core/number',
            '@/main',
          ]);
        }, flatProject);
      });

      it('should return two flattened nodes', () => {
        const flatProject = flatten(project, '@/main', ['js']);

        expect(flatProject.isRight).to.be.true();
        Helper.expectEither(newProject => {
          expect(R.keys(newProject.patches['@/main'].nodes)).to.be.deep.equal([
            'a~a',
            'b',
          ]);
        }, flatProject);
      });

      it('should return one flattened links', () => {
        const flatProject = flatten(project, '@/main', ['js']);

        expect(flatProject.isRight).to.be.true();
        Helper.expectEither(newProject => {
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
            impls: {
              js: '//ok',
            },
          },
        },
      });

      it(`should return Either.Left with error "${
        CONST.ERROR.CAST_PATCH_NOT_FOUND
      }"`, () => {
        const flatProject = flatten(project, '@/main', ['js']);

        expect(flatProject.isLeft).to.be.true();
        Helper.expectErrorMessage(
          expect,
          flatProject,
          formatString(CONST.ERROR.CAST_PATCH_NOT_FOUND, {
            patchPath: 'xod/core/cast-boolean-to-number',
          })
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
        const castMultipleOutputs = fromXodballDataUnsafe(
          castMultipleOutputsXodball
        );
        const flatProject = flatten(castMultipleOutputs, '@/main', [
          'arduino',
          'cpp',
        ]);

        expect(flatProject.isRight).to.be.true();
        Helper.expectEither(project => {
          expect(project).to.deep.equal(castMultipleOutputsFlat);
        }, flatProject);
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
            impls: {
              js: '// ok',
            },
          },
        },
      });

      const flatProject = flatten(project, '@/main', ['js']);

      expect(flatProject.isRight).to.be.true();
      Helper.expectEither(newProject => {
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
            impls: {
              js: '//ok',
            },
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
            impls: {
              js: '// BOOL2NUM',
            },
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
            impls: {
              js: '// NUM2BOOL',
            },
          },
        },
      });
      const flatProject = flatten(project, '@/main', ['js']);

      expect(flatProject.isRight).to.be.true();
      Helper.expectEither(newProject => {
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
            impls: {
              js: '// ok',
            },
          },
        },
      });
      const flatProject = flatten(project, '@/main', ['js']);
      expect(flatProject.isRight).to.be.true();
      Helper.expectEither(newProject => {
        const node = newProject.patches['@/main'].nodes.m;
        expect(node.boundValues).to.deep.equal({
          in1: 26,
          in2: 42,
        });
      }, flatProject);
    });

    it('should propagate bound values to nested patches', () => {
      const flatProject = flatten(boundInputValuesPropagation, '@/main', [
        'cpp',
      ]);

      expect(flatProject.isRight).to.be.true();
      Helper.expectEither(project => {
        expect(project).to.deep.equal(boundInputValuesPropagationFlat);
      }, flatProject);
    });

    it('should propagate bound values to DEEPLY nested patches', () => {
      const deepBoundValuesPropagationProject = fromXodballDataUnsafe(
        deepBoundValuesPropagationXodball
      );
      const flatProject = flatten(deepBoundValuesPropagationProject, '@/main', [
        'arduino',
        'cpp',
      ]);

      expect(flatProject.isRight).to.be.true();
      Helper.expectEither(project => {
        expect(project).to.deep.equal(deepBoundValuesPropagationFlat);
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
        'xod/core/or': {
          nodes: {
            noNativeImpl: {
              id: 'noNativeImpl',
              position: { x: 100, y: 100 },
              type: 'xod/patch-nodes/not-implemented-in-xod',
            },
          },
          impls: {
            js: '// ok',
            arduino: '// ok',
          },
        },
        'xod/core/and': {
          nodes: {
            noNativeImpl: {
              id: 'noNativeImpl',
              position: { x: 100, y: 100 },
              type: 'xod/patch-nodes/not-implemented-in-xod',
            },
          },
          impls: {
            js: '// ok',
            cpp: '// ok',
          },
        },
      },
    });

    describe('single', () => {
      it('defined implementation exists', () => {
        const flatProject = flatten(project, '@/main', ['js']);

        expect(flatProject.isRight).to.be.true();
        Helper.expectEither(newProject => {
          expect(newProject.patches['@/main']).to.be.deep.equal(
            project.patches['@/main']
          );
        }, flatProject);
      });
      it('no defined implementation in the project', () => {
        const flatProject = flatten(project, '@/main', ['java']);
        expect(flatProject.isLeft).to.be.true();
        Helper.expectErrorMessage(
          expect,
          flatProject,
          formatString(CONST.ERROR.IMPLEMENTATION_NOT_FOUND, {
            impl: 'java',
            patchPath: 'xod/core/or',
          })
        );
      });
    });
    describe('multiple', () => {
      it('defined implementations exists', () => {
        const flatProject = flatten(project, '@/main', ['arduino', 'cpp']);

        expect(flatProject.isRight).to.be.true();
        Helper.expectEither(newProject => {
          expect(newProject.patches['@/main']).to.be.deep.equal(
            project.patches['@/main']
          );
        }, flatProject);
      });
      it('no defined implementations in the project', () => {
        const impls = ['java', 'scala'];
        const flatProject = flatten(project, '@/main', impls);
        expect(flatProject.isLeft).to.be.true();
        Helper.expectErrorMessage(
          expect,
          flatProject,
          formatString(CONST.ERROR.IMPLEMENTATION_NOT_FOUND, {
            impl: impls,
            patchPath: 'xod/core/or',
          })
        );
      });
    });
    describe('patch not implemented in xod as an entry point', () => {
      it('should not be a valid entry point if it has no defined implementation', () => {
        const flatProject = flatten(project, 'xod/core/or', ['java']);
        expect(flatProject.isLeft).to.be.true();
        Helper.expectErrorMessage(
          expect,
          flatProject,
          formatString(CONST.ERROR.IMPLEMENTATION_NOT_FOUND, {
            impl: 'java',
            patchPath: 'xod/core/or',
          })
        );
      });
      it('shoud be a valid entry point if it has required implementation', () => {
        const flatProject = flatten(project, 'xod/core/or', ['js']);

        expect(flatProject.isRight).to.be.true();
        Helper.expectEither(newProject => {
          expect(newProject.patches['xod/core/or']).to.be.deep.equal(
            project.patches['xod/core/or']
          );
        }, flatProject);
      });
    });
    // TODO: Write test:
    //       Check taking of patch with implementation even it has nodes
    //       and recursively extracting nodes if not
  });
});
