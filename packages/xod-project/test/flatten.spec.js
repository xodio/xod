import R from 'ramda';
import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';

import * as Helper from './helpers';
import * as CONST from '../src/constants';
import flatten from '../src/flatten';

chai.use(dirtyChai);

describe('Flatten', () => {
  describe('trivial', () => {
    const project = {
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
          nodes: {},
          links: {},
          pins: {
            in1: {
              key: 'in1',
              type: 'boolean',
              direction: 'input',
            },
            in2: {
              key: 'in2',
              type: 'boolean',
              direction: 'input',
            },
            out: {
              key: 'out',
              type: 'boolean',
              direction: 'output',
            },
          },
          impls: {
            js: '//ok',
          },
        },
      },
    };

    it('should return error if implementation not found', () => {
      const flatProject = flatten(project, '@/main', ['cpp']);

      expect(flatProject.isLeft).to.be.true();
      Helper.expectErrorMessage(expect, flatProject, CONST.ERROR.IMPLEMENTATION_NOT_FOUND);
    });

    it('should ignore not referred patches', () => {
      const flatProject = flatten(project, 'xod/core/or', ['js']);

      expect(flatProject.isRight).to.be.true();
      Helper.expectEither(
        (newProject) => {
          expect(R.keys(newProject.patches))
            .to.be.deep.equal(['xod/core/or']);
          expect(newProject.patches['xod/core/or'])
            .to.be.deep.equal(project.patches['xod/core/or']);
        },
        flatProject
      );
    });

    it('should return patch and its dependencies', () => {
      const flatProject = flatten(project, '@/main', ['js']);

      expect(flatProject.isRight).to.be.true();
      Helper.expectEither(
        (newProject) => {
          expect(R.keys(newProject.patches))
            .to.be.deep.equal(['xod/core/or', '@/main']);
          expect(newProject.patches['@/main'].nodes)
            .to.be.deep.equal(project.patches['@/main'].nodes);
        },
        flatProject
      );
    });

    it('should return patch with links', () => {
      const flatProject = flatten(project, '@/main', ['js']);

      expect(flatProject.isRight).to.be.true();
      Helper.expectEither(
        (newProject) => {
          expect(R.keys(newProject.patches))
            .to.be.deep.equal(['xod/core/or', '@/main']);
          expect(newProject.patches['@/main'].links)
            .to.be.deep.equal(project.patches['@/main'].links);
        },
        flatProject
      );
    });
  });

  describe('recursive', () => {
    const project = {
      patches: {
        '@/main': {
          nodes: {
            a: {
              id: 'a',
              type: '@/foo',
            },
          },
          links: {},
        },
        '@/foo': {
          nodes: {
            a: {
              id: 'a',
              type: 'xod/core/or',
            },
          },
          links: {},
        },
        'xod/core/or': {
          nodes: {},
          links: {},
          impls: {
            js: '//ok',
          },
        },
      },
    };

    it('should ignore not referred patches', () => {
      const flatProject = flatten(project, '@/foo', ['js']);

      expect(flatProject.isRight).to.be.true();
      Helper.expectEither(
        (newProject) => {
          expect(R.keys(newProject.patches))
            .to.be.deep.equal(['xod/core/or', '@/foo']);
          expect(newProject.patches['xod/core/or'])
            .to.be.deep.equal(project.patches['xod/core/or']);
          expect(newProject.patches['@/foo'])
            .to.be.deep.equal(project.patches['@/foo']);
        },
        flatProject
      );
    });

    it('should return patch and its dependencies', () => {
      const flatProject = flatten(project, '@/main', ['js']);

      expect(flatProject.isRight).to.be.true();
      Helper.expectEither(
        (newProject) => {
          expect(R.keys(newProject.patches))
            .to.be.deep.equal(['xod/core/or', '@/main']);
          expect(newProject.patches['xod/core/or'])
            .to.be.deep.equal(project.patches['xod/core/or']);
          expect(R.values(newProject.patches['@/main'].nodes)[0])
            .to.have.property('type')
            .that.equals('xod/core/or');
        },
        flatProject
      );
    });

    it('should return nodes with prefixed ids', () => {
      const flatProject = flatten(project, '@/main', ['js']);

      expect(flatProject.isRight).to.be.true();
      Helper.expectEither(
        (newProject) => {
          expect(R.keys(newProject.patches))
            .to.be.deep.equal(['xod/core/or', '@/main']);
          expect(newProject.patches['xod/core/or'])
            .to.be.deep.equal(project.patches['xod/core/or']);
          expect(R.values(newProject.patches['@/main'].nodes)[0])
            .to.have.property('id')
            .that.equal('a~a');
        },
        flatProject
      );
    });
  });
});
