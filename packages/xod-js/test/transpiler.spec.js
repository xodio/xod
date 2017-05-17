import R from 'ramda';
import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';

import { createPatch } from 'xod-project';
import { defaultizeProject } from 'xod-project/test/helpers';
import { foldEither } from 'xod-func-tools';
import * as Transpiler from '../src/transpiler';
import easy from './fixtures/easy.txt';

chai.use(dirtyChai);

describe('Transpiler', () => {
  describe('extractPatchImpls', () => {
    const project = defaultizeProject({
      patches: {
        '@/js': {
          impls: {
            js: '//js',
          },
        },
        '@/nodejs': {
          impls: {
            nodejs: '//nodejs',
          },
        },
        '@/both': {
          impls: {
            js: '//js',
            nodejs: '//nodejs',
          },
        },
      },
    });

    it('should return an empty object for non-existing implementations', () => {
      const result = Transpiler.extractPatchImpls(['cpp'], project);

      expect(result).to.be.an('object').and.empty();
    });
    it('should return a map with implementations', () => {
      const result = Transpiler.extractPatchImpls(['js', 'nodejs'], project);

      expect(result).to.deep.equal({
        '@/js': '//js',
        '@/nodejs': '//nodejs',
        '@/both': '//js',
      });
    });
  });

  describe('transformations', () => {
    const project = defaultizeProject({
      patches: {
        '@/main': {
          nodes: {
            0: {
              id: '0',
              type: 'xod/nodes/test',
              position: {
                x: 0,
                y: 0,
              },
              boundValues: {
                in_A: {
                  value: 10,
                  curried: true,
                },
              },
            },
            1: {
              id: '1',
              type: 'xod/nodes/test',
              position: {
                x: 200,
                y: 0,
              },
              boundValues: {},
            },
          },
          links: {
            l1: {
              id: 'l1',
              input: {
                nodeId: '1',
                pinKey: 'in_A',
              },
              output: {
                nodeId: '0',
                pinKey: 'out',
              },
            },
            l2: {
              id: 'l2',
              input: {
                nodeId: '1',
                pinKey: 'in_B',
              },
              output: {
                nodeId: '0',
                pinKey: 'out',
              },
            },
          },
        },
        'xod/nodes/test': {
          nodes: {
            noNativeImpl: {
              description: '',
              id: 'noNativeImpl',
              label: '',
              position: {
                x: 100,
                y: 100,
              },
              type: 'xod/patch-nodes/not-implemented-in-xod',
            },
            in_A: {
              id: 'in_A',
              type: 'xod/patch-nodes/input-number',
              position: {
                x: 0,
                y: 0,
              },
              label: '',
              description: '',
            },
            in_B: {
              id: 'in_B',
              type: 'xod/patch-nodes/input-string',
              position: {
                x: 200,
                y: 0,
              },
              label: '',
              description: '',
            },
            out: {
              id: 'out',
              type: 'xod/patch-nodes/output-boolean',
              position: {
                x: 0,
                y: 300,
              },
              label: '',
              description: '',
            },
          },
          links: {},
          impls: {
            js: '// ok',
          },
        },
      },
    });
    const patchWithConst = R.mergeWith(R.merge,
      project.patches['@/main'],
      {
        nodes: {
          '0_in_A': {
            id: '0_in_A',
            type: 'xod/internal/const',
            value: 10,
            position: { x: 0, y: 0 },
            boundValues: {},
            label: '',
            description: '',
          },
        },
        links: {
          '0_in_A-to-0': {
            id: '0_in_A-to-0',
            input: { nodeId: '0', pinKey: 'in_A' },
            output: { nodeId: '0_in_A', pinKey: 'value' },
          },
        },
      }
    );
    const expectedNodes = [
      {
        id: '0',
        implId: 'xod/nodes/test',
        inputTypes: {
          in_A: Number,
          in_B: String,
        },
        outLinks: {
          out: [{
            key: 'in_A',
            nodeId: '1',
          }, {
            key: 'in_B',
            nodeId: '1',
          }],
        },
      },
      {
        id: '1',
        implId: 'xod/nodes/test',
        inputTypes: {
          in_A: Number,
          in_B: String,
        },
        outLinks: {},
      },
      {
        id: '0_in_A',
        implId: 'xod/internal/const',
        value: 10,
        inputTypes: {},
        outLinks: {
          value: [{
            key: 'in_A',
            nodeId: '0',
          }],
        },
      },
    ];

    describe('getInputTypes', () => {
      it('should return an empty object for empty patch', () => {
        expect(Transpiler.getInputTypes(createPatch()))
          .to.be.an('object')
          .and.empty();
      });
      it('should return an empty object for patch without pins', () => {
        const patch = project.patches['@/main'];
        expect(Transpiler.getInputTypes(patch))
          .to.be.an('object')
          .and.empty();
      });
      it('should return a correct input types', () => {
        const patch = project.patches['xod/nodes/test'];
        expect(Transpiler.getInputTypes(patch))
          .to.be.deep.equal({
            in_A: Number,
            in_B: String,
          });
      });
    });

    describe('getOutLinks', () => {
      it('should return an empty object for empty patch', () => {
        expect(Transpiler.getOutLinks('0', createPatch()))
          .to.be.an('object')
          .and.empty();
      });
      it('should return an empty object for node without out links', () => {
        const patch = project.patches['@/main'];
        expect(Transpiler.getOutLinks('1', patch))
          .to.be.an('object')
          .and.empty();
      });
      it('should return a correct output links', () => {
        const patch = project.patches['@/main'];
        expect(Transpiler.getOutLinks('0', patch))
          .to.be.deep.equal({
            out: [{
              key: 'in_A',
              nodeId: '1',
            }, {
              key: 'in_B',
              nodeId: '1',
            }],
          });
      });
    });

    describe('getCurriedPins', () => {
      it('should return empty array for node without curried pins', () => {
        const typePatch = project.patches['xod/nodes/test'];
        const node = project.patches['@/main'].nodes['1'];
        expect(Transpiler.getCurriedPins(node, typePatch))
          .to.be.an('array')
          .and.empty();
      });
      it('should return array with one pair [pinKey, pinValue] for node with one curried pin', () => {
        const typePatch = project.patches['xod/nodes/test'];
        const node = project.patches['@/main'].nodes['0'];
        expect(Transpiler.getCurriedPins(node, typePatch))
          .to.be.deep.equal([['in_A', 10]]);
      });
    });

    describe('addConstNodesToPatch', () => {
      it('should return the same patch', () => {
        const patch = project.patches['xod/nodes/test'];
        expect(Transpiler.addConstNodesToPatch(project, patch))
          .to.be.deep.equal(patch);
      });
      it('should return patch with additional node and additional link', () => {
        const patch = project.patches['@/main'];
        expect(Transpiler.addConstNodesToPatch(project, patch))
          .to.be.deep.equal(patchWithConst);
      });
    });

    describe('transformPatch', () => {
      it('should return Maybe.Nothing for non-existing path', () => {
        expect(Transpiler.transformPatch('non/existing/path', project).isNothing).to.be.true();
      });
      it('should return Maybe.Just for existing path with transformed patch', () => {
        const newPatch = Transpiler.transformPatch('@/main', project);
        expect(newPatch.isJust).to.be.true();

        const newNodes = R.keys(newPatch.chain(R.prop('nodes')));
        const newLinks = R.keys(newPatch.chain(R.prop('links')));

        expect(newNodes)
          .to.include.members(['0', '1', '0_in_A']);
        expect(newLinks)
          .to.include.members(['l1', 'l2', '0_in_A-to-0']);
      });
    });

    describe('transformNode', () => {
      it('should return the same node, but transformed', () => {
        const patch = project.patches['@/main'];
        const node = patch.nodes['1'];
        expect(Transpiler.transformNode(patch, project, node))
          .to.be.deep.equal(expectedNodes[1]);
      });
      it('should return the transformed xod/internal/const node', () => {
        const node = patchWithConst.nodes['0_in_A'];
        expect(Transpiler.transformNode(patchWithConst, project, node))
          .to.be.deep.equal(expectedNodes[2]);
      });
    });

    describe('transformNodes', () => {
      it('should return empty list for empty patch', () => {
        expect(Transpiler.transformNodes(createPatch(), {}))
          .to.be.an('array')
          .and.empty();
      });
      it('should return a list of transformed nodes', () => {
        expect(Transpiler.transformNodes(patchWithConst, project))
          .to.be.deep.equal(expectedNodes);
      });
    });
  });

  describe('end-to-end test', () => {
    it('easy project: should return transpiled code', () => {
      const project = defaultizeProject({
        patches: {
          '@/main': {
            nodes: {
              0: {
                id: '0',
                type: 'xod/nodes/test',
                position: {
                  x: 0,
                  y: 0,
                },
                boundValues: {
                  in_A: {
                    value: 10,
                    curried: true,
                  },
                },
              },
              1: {
                id: '1',
                type: 'xod/nodes/test',
                position: {
                  x: 0,
                  y: 0,
                },
                boundValues: {},
              },
            },
            links: {
              l1: {
                id: 'l1',
                input: {
                  nodeId: '1',
                  pinKey: 'in_A',
                },
                output: {
                  nodeId: '0',
                  pinKey: 'out',
                },
              },
              l2: {
                id: 'l2',
                input: {
                  nodeId: '1',
                  pinKey: 'in_B',
                },
                output: {
                  nodeId: '0',
                  pinKey: 'out',
                },
              },
            },
          },
          'xod/nodes/test': {
            nodes: {
              noNativeImpl: {
                description: '',
                id: 'noNativeImpl',
                label: '',
                position: {
                  x: 100,
                  y: 100,
                },
                type: 'xod/patch-nodes/not-implemented-in-xod',
              },
              in_A: {
                id: 'in_A',
                type: 'xod/patch-nodes/input-number',
                position: {
                  x: 0,
                  y: 0,
                },
                label: '',
                description: '',
              },
              in_B: {
                id: 'in_B',
                type: 'xod/patch-nodes/input-number',
                position: {
                  x: 200,
                  y: 0,
                },
                label: '',
                description: '',
              },
              out: {
                id: 'out',
                type: 'xod/patch-nodes/output-number',
                position: {
                  x: 0,
                  y: 300,
                },
                label: '',
                description: '',
              },
            },
            links: {},
            impls: {
              js: '// ok',
            },
          },
        },
      });
      const eitherResult = Transpiler.default({
        project,
        path: '@/main',
        impls: ['js'],
        launcher: '// yahoo!',
      });

      // It will begin with [object Object] instead of real jsRuntime,
      // cause we use babel-loader in tests for /platform/*.js instead
      // of raw-loader to run tests for runtime.spec.js
      foldEither(
        err => expect.fail(err.message),
        result => expect(result.trim()).to.be.equal(easy.trim()),
        eitherResult
      );
    });
  });
});
