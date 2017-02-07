import R from 'ramda';
import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';

import * as Helper from './helpers';
import * as CONST from '../src/constants';
import flatten from '../src/flatten';
import { getCastPatchPath } from '../src/utils';

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
              type: 'xod/core/outputBool',
            },
            c: {
              id: 'c',
              type: '@/foo',
            },
            d: {
              id: 'd',
              type: 'xod/core/outputBool',
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
          pins: {
            b: {
              key: 'b',
              type: 'boolean',
              direction: 'output',
            },
            d: {
              key: 'd',
              type: 'boolean',
              direction: 'output',
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
        'xod/core/outputBool': {
          nodes: {},
          links: {},
          pins: {
            __in__: {
              key: '__in__',
              type: 'boolean',
              direction: 'input',
            },
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
          expect(newProject.patches['@/foo'].nodes)
            .to.be.deep.equal(project.patches['@/foo'].nodes);
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

    it('should remove unused terminals', () => {
      const flatProject = flatten(project, '@/main', ['js']);

      expect(flatProject.isRight).to.be.true();
      Helper.expectEither(
        (newProject) => {
          expect(newProject.patches['@/main'].nodes)
            .to.have.not.property('b~d');
        },
        flatProject
      );
    });

    it('should return flattened links', () => {
      const flatProject = flatten(project, '@/main', ['js']);


      expect(flatProject.isRight).to.be.true();
      Helper.expectEither(
        (newProject) => {
          expect(R.keys(newProject.patches))
            .to.be.deep.equal(['xod/core/or', '@/main']);
          expect(R.values(newProject.patches['@/main'].links))
            .to.have.lengthOf(2);
        },
        flatProject
      );
    });
  });

  describe('casting nodes', () => {
    const testDiffTypes = (fn) => {
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
      const project = {
        patches: {
          '@/main': {
            nodes: {
              a: {
                id: 'a',
                type: 'xod/core/number',
              },
              b: {
                id: 'b',
                type: 'xod/core/outputBool',
              },
            },
            links: {},
          },
          'xod/core/number': {
            nodes: {},
            links: {},
            pins: {
              out: {
                key: 'out',
                type: 'number',
                direction: 'output',
              },
            },
            impls: {
              js: '//OK',
            },
          },
          'xod/core/outputBool': {
            nodes: {},
            links: {},
            pins: {
              __in__: {
                key: '__in__',
                type: 'boolean',
                direction: 'input',
              },
            },
          },
          'xod/core/cast-boolean-to-number': {
            nodes: {},
            links: {},
            pins: {
              __in__: {
                key: '__in__',
                type: 'boolean',
                direction: 'input',
              },
              __out__: {
                key: '__out__',
                type: 'boolean',
                direction: 'input',
              },
            },
            impls: {},
          },
        },
      };

      it('should return patches without cast patch', () => {
        const flatProject = flatten(project, '@/main', ['js']);

        expect(flatProject.isRight).to.be.true();
        Helper.expectEither(
          (newProject) => {
            expect(R.keys(newProject.patches))
              .to.be.deep.equal(['xod/core/number', '@/main']);
          },
          flatProject
        );
      });

      it('should return @/main without cast node and link to it', () => {
        const flatProject = flatten(project, '@/main', ['js']);

        expect(flatProject.isRight).to.be.true();
        Helper.expectEither(
          (newProject) => {
            expect(R.keys(newProject.patches['@/main'].nodes))
              .to.be.deep.equal(['a']);
            expect(R.values(newProject.patches['@/main'].links))
              .to.have.lengthOf(0);
          },
          flatProject
        );
      });
    });

    describe('through output terminal', () => {
      const createCastOutputTest = (typeIn, typeOut) => {
        it(`${typeIn} -> ${getCastPatchPath(typeIn, typeOut)} -> ${typeOut}`, () => {
          const project = {
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
                    type: `xod/core/output${typeOut}`,
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
                pins: {
                  b: {
                    key: 'b',
                    type: typeOut,
                    direction: 'output',
                  },
                },
              },
              [`xod/core/${typeIn}`]: {
                nodes: {},
                links: {},
                pins: {
                  out: {
                    key: 'out',
                    type: typeIn,
                    direction: 'output',
                  },
                },
                impls: {
                  js: '//OK',
                },
              },
              [`xod/core/${typeOut}`]: {
                nodes: {},
                links: {},
                pins: {
                  in: {
                    key: 'in',
                    type: typeOut,
                    direction: 'input',
                  },
                },
                impls: {
                  js: '//OK',
                },
              },
              [`xod/core/output${typeOut}`]: {
                nodes: {},
                links: {},
                pins: {
                  __in__: {
                    key: '__in__',
                    type: typeOut,
                    direction: 'input',
                  },
                },
              },
              [`xod/core/cast-${typeIn}-to-${typeOut}`]: {
                nodes: {},
                links: {},
                pins: {
                  __in__: {
                    key: '__in__',
                    type: typeIn,
                    direction: 'input',
                  },
                  __out__: {
                    key: '__out__',
                    type: typeOut,
                    direction: 'input',
                  },
                },
                impls: {},
              },
            },
          };

          if (typeOut === typeIn) {
            project.patches[`xod/core/${typeOut}`].pins = {
              in: {
                key: 'in',
                type: typeOut,
                direction: 'input',
              },
              out: {
                key: 'out',
                type: typeOut,
                direction: 'output',
              },
            };
          }

          const flatProject = flatten(project, '@/main', ['js']);
          const expectedPath = `xod/core/cast-${typeIn}-to-${typeOut}`; // getCastPatchPath(typeIn, typeOut);
          const expectedPaths = (typeIn === typeOut) ?
            [`xod/core/${typeIn}`, expectedPath, '@/main'] :
            [`xod/core/${typeIn}`, `xod/core/${typeOut}`, expectedPath, '@/main'];

          expect(flatProject.isRight).to.be.true();
          Helper.expectEither(
            (newProject) => {
              expect(R.keys(newProject.patches))
                .to.be.deep.equal(expectedPaths);
              expect(newProject.patches[expectedPath])
                .to.be.deep.equal(project.patches[expectedPath]);
            },
            flatProject
          );
        });
      };
      testDiffTypes(createCastOutputTest);
    });

    describe('through input terminal', () => {
      const createCastInputTest = (typeIn, typeOut) => {
        it(`${typeIn} -> ${getCastPatchPath(typeIn, typeOut)} -> ${typeOut}`, () => {
          const project = {
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
                    type: `xod/core/input${typeOut}`,
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
                pins: {
                  b: {
                    key: 'b',
                    type: typeOut,
                    direction: 'input',
                  },
                },
              },
              [`xod/core/${typeOut}`]: {
                nodes: {},
                links: {},
                pins: {
                  in: {
                    key: 'in',
                    type: typeOut,
                    direction: 'input',
                  },
                },
                impls: {
                  js: '//OK',
                },
              },
              [`xod/core/${typeIn}`]: {
                nodes: {},
                links: {},
                pins: {
                  out: {
                    key: 'out',
                    type: typeIn,
                    direction: 'output',
                  },
                },
                impls: {
                  js: '//OK',
                },
              },
              [`xod/core/input${typeOut}`]: {
                nodes: {},
                links: {},
                pins: {
                  __out__: {
                    key: '__out__',
                    type: typeOut,
                    direction: 'output',
                  },
                },
              },
              [`xod/core/cast-${typeIn}-to-${typeOut}`]: {
                nodes: {},
                links: {},
                pins: {
                  __in__: {
                    key: '__in__',
                    type: typeIn,
                    direction: 'input',
                  },
                  __out__: {
                    key: '__out__',
                    type: typeOut,
                    direction: 'input',
                  },
                },
                impls: {},
              },
            },
          };

          if (typeOut === typeIn) {
            project.patches[`xod/core/${typeOut}`].pins = {
              in: {
                key: 'in',
                type: typeOut,
                direction: 'input',
              },
              out: {
                key: 'out',
                type: typeOut,
                direction: 'output',
              },
            };
          }

          const flatProject = flatten(project, '@/main', ['js']);
          const expectedPath = `xod/core/cast-${typeIn}-to-${typeOut}`; // getCastPatchPath(typeIn, typeOut);
          const expectedPaths = (typeIn === typeOut) ?
            [`xod/core/${typeIn}`, expectedPath, '@/main'] :
            [`xod/core/${typeIn}`, `xod/core/${typeOut}`, expectedPath, '@/main'];

          expect(flatProject.isRight).to.be.true();
          Helper.expectEither(
            (newProject) => {
              expect(R.keys(newProject.patches))
                .to.be.deep.equal(expectedPaths);
              expect(newProject.patches[expectedPath])
                .to.be.deep.equal(project.patches[expectedPath]);
            },
            flatProject
          );
        });
      };
      testDiffTypes(createCastInputTest);
    });

    // TODO: Write test:
    //       it should remove terminal, link and there is should be no casting nodes
    //       E.G. [Number]---[outputBool] --> [Number]
    describe('one link to terminal', () => {});

    // TODO: Write test:
    //       it should replace terminal with two casting nodes and three links
    //       E.G. [Number]---[outputBool]---[String] -->
    //        --> [Number]---[cast-number-to-boolean]---[cast-boolean-to-string]---[String]
    describe('three different types', () => {});

    describe('with same types', () => {
      const project = {
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
                type: 'xod/core/outputNumber',
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
            pins: {
              b: {
                key: 'b',
                type: 'number',
                direction: 'output',
              },
            },
          },
          'xod/core/number': {
            nodes: {},
            links: {},
            pins: {
              in: {
                key: 'in',
                type: 'number',
                direction: 'input',
              },
              out: {
                key: 'out',
                type: 'number',
                direction: 'output',
              },
            },
            impls: {
              js: '//OK',
            },
          },
          'xod/core/outputNumber': {
            nodes: {},
            links: {},
            pins: {
              __in__: {
                key: '__in__',
                type: 'number',
                direction: 'input',
              },
            },
          },
        },
      };

      it('should return patches without cast patch', () => {
        const flatProject = flatten(project, '@/main', ['js']);

        expect(flatProject.isRight).to.be.true();
        Helper.expectEither(
          (newProject) => {
            expect(R.keys(newProject.patches))
              .to.be.deep.equal(['xod/core/number', '@/main']);
          },
          flatProject
        );
      });

      it('should return two flattened nodes', () => {
        const flatProject = flatten(project, '@/main', ['js']);

        expect(flatProject.isRight).to.be.true();
        Helper.expectEither(
          (newProject) => {
            expect(R.keys(newProject.patches['@/main'].nodes))
              .to.be.deep.equal(['a~a', 'b']);
          },
          flatProject
        );
      });

      it('should return one flattened links', () => {
        const flatProject = flatten(project, '@/main', ['js']);

        expect(flatProject.isRight).to.be.true();
        Helper.expectEither(
          (newProject) => {
            expect(R.values(newProject.patches['@/main'].links))
              .to.have.lengthOf(1)
              .and.have.property(0)
              .that.deep.equal({
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
          },
          flatProject
        );
      });
    });

    describe('without casting nodes in project', () => {
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
                type: 'xod/core/outputNumber',
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
          'xod/core/outputNumber': {
            nodes: {},
            links: {},
            pins: {
              __in__: {
                key: '__in__',
                type: 'number',
                direction: 'input',
              },
            },
          },
        },
      };

      it(`should return Either.Left with error "${CONST.ERROR.CAST_PATCH_NOT_FOUND}"`, () => {
        const flatProject = flatten(project, '@/main', ['js']);

        expect(flatProject.isLeft).to.be.true();
        Helper.expectErrorMessage(expect, flatProject, CONST.ERROR.CAST_PATCH_NOT_FOUND);
      });
    });
  });

  describe('injected pins', () => {
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
              type: '@/foo',
              pins: {
                a2: {
                  injected: true,
                  value: 32,
                },
                a3: {
                  injected: true,
                  value: 27,
                },
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
              type: 'xod/core/inputNumber',
            },
            a2: {
              id: 'a2',
              type: 'xod/core/inputNumber',
            },
            a3: {
              id: 'a3',
              type: 'xod/core/inputNumber',
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
              type: 'xod/core/outputBool',
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
          pins: {
            a: {
              key: 'a',
              type: 'number',
              direction: 'input',
            },
            a2: {
              key: 'a2',
              type: 'number',
              direction: 'input',
            },
            a3: {
              key: 'a3',
              type: 'number',
              direction: 'input',
            },
            c: {
              key: 'c',
              type: 'boolean',
              direction: 'output',
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
        'xod/core/outputBool': {
          nodes: {},
          links: {},
          pins: {
            __in__: {
              key: '__in__',
              type: 'boolean',
              direction: 'input',
            },
          },
        },
        'xod/core/inputNumber': {
          nodes: {},
          links: {},
          pins: {
            __out__: {
              key: '__out__',
              type: 'number',
              direction: 'output',
            },
          },
        },
        'xod/core/cast-boolean-to-number': {
          nodes: {},
          links: {},
          pins: {
            __in__: {
              key: '__in__',
              type: 'boolean',
              direction: 'input',
            },
            __out__: {
              key: '__out__',
              type: 'number',
              direction: 'input',
            },
          },
          impls: {
            js: '// BOOL2NUM',
          },
        },
        'xod/core/cast-number-to-boolean': {
          nodes: {},
          links: {},
          pins: {
            __in__: {
              key: '__in__',
              type: 'number',
              direction: 'input',
            },
            __out__: {
              key: '__out__',
              type: 'boolean',
              direction: 'input',
            },
          },
          impls: {
            js: '// NUM2BOOL',
          },
        },
      },
    };

    it('should return node b~b with injected pin a2', () => {
      const flatProject = flatten(project, '@/main', ['js']);

      expect(flatProject.isRight).to.be.true();
      Helper.expectEither(
        (newProject) => {
          expect(newProject.patches['@/main'].nodes['b~a2-to-b~b'])
            .to.have.property('pins')
            .that.have.property('__in__')
            .that.deep.equal(project.patches['@/main'].nodes.b.pins.a2);
          expect(newProject.patches['@/main'].nodes['b~a3-to-b~b2'])
            .to.have.property('pins')
            .that.have.property('__in__')
            .that.deep.equal(project.patches['@/main'].nodes.b.pins.a3);
        },
        flatProject
      );
    });
  });

  // TODO: Write test:
  //       Check correct priority when taking leaf patches.
  describe('impls priority', () => {});
});
