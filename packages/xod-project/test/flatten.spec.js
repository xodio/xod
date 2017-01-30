import R from 'ramda';
import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';

import * as Helper from './helpers';
import * as CONST from '../src/constants';
import { getCastPath, getCastPatch } from '../src/utils';
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
    const pathBool2Bool = getCastPath(CONST.PIN_TYPE.BOOLEAN, CONST.PIN_TYPE.BOOLEAN);

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
            .to.be.deep.equal(['xod/core/or', pathBool2Bool, '@/main']);
          expect(newProject.patches['xod/core/or'])
            .to.be.deep.equal(project.patches['xod/core/or']);
          expect(newProject.patches[pathBool2Bool])
            .to.be.deep.equal(getCastPatch(CONST.PIN_TYPE.BOOLEAN, CONST.PIN_TYPE.BOOLEAN));
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
            .to.be.deep.equal(['xod/core/or', pathBool2Bool, '@/main']);
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
          // console.log(JSON.stringify(newProject));
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
            .to.be.deep.equal(['xod/core/or', pathBool2Bool, '@/main']);
          expect(R.values(newProject.patches['@/main'].links))
            .to.have.lengthOf(3);
        },
        flatProject
      );
    });
  });

  describe('casting nodes', () => {
    const testTypes = (fn) => {
      // number to *
      fn(CONST.PIN_TYPE.NUMBER, CONST.PIN_TYPE.NUMBER);
      fn(CONST.PIN_TYPE.NUMBER, CONST.PIN_TYPE.BOOLEAN);
      fn(CONST.PIN_TYPE.NUMBER, CONST.PIN_TYPE.STRING);
      fn(CONST.PIN_TYPE.NUMBER, CONST.PIN_TYPE.PULSE);
      // boolean to *
      fn(CONST.PIN_TYPE.BOOLEAN, CONST.PIN_TYPE.BOOLEAN);
      fn(CONST.PIN_TYPE.BOOLEAN, CONST.PIN_TYPE.NUMBER);
      fn(CONST.PIN_TYPE.BOOLEAN, CONST.PIN_TYPE.STRING);
      fn(CONST.PIN_TYPE.BOOLEAN, CONST.PIN_TYPE.PULSE);
      // string to *
      fn(CONST.PIN_TYPE.STRING, CONST.PIN_TYPE.STRING);
      fn(CONST.PIN_TYPE.STRING, CONST.PIN_TYPE.BOOLEAN);
      fn(CONST.PIN_TYPE.STRING, CONST.PIN_TYPE.PULSE);
      // pulse to *
      fn(CONST.PIN_TYPE.PULSE, CONST.PIN_TYPE.PULSE);
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

    describe('one link to terminal', () => {
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
        it(`${typeIn} -> ${getCastPath(typeIn, typeOut)} -> ${typeOut}`, () => {
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
                    type: 'xod/core/outputX',
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
              'xod/core/outputX': {
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
          const expectedPath = getCastPath(typeIn, typeOut);
          const expectedPaths = (typeIn === typeOut) ?
            [`xod/core/${typeIn}`, expectedPath, '@/main'] :
            [`xod/core/${typeIn}`, expectedPath, `xod/core/${typeOut}`, '@/main'];

          expect(flatProject.isRight).to.be.true();
          Helper.expectEither(
            (newProject) => {
              expect(R.keys(newProject.patches))
                .to.be.deep.equal(expectedPaths);
              expect(newProject.patches[expectedPath])
                .to.be.deep.equal(getCastPatch(typeIn, typeOut));
            },
            flatProject
          );
        });
      };
      testTypes(createCastOutputTest);
    });

    describe('through input terminal', () => {
      // inputX to Y
      const createCastInputTest = (typeIn, typeOut) => {
        it(`${typeIn} -> ${getCastPath(typeIn, typeOut)} -> ${typeOut}`, () => {
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
                    type: 'xod/core/inputX',
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
              'xod/core/inputX': {
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
          const expectedPath = getCastPath(typeIn, typeOut);
          const expectedPaths = (typeIn === typeOut) ?
            [`xod/core/${typeIn}`, expectedPath, '@/main'] :
            [`xod/core/${typeIn}`, `xod/core/${typeOut}`, expectedPath, '@/main'];

          expect(flatProject.isRight).to.be.true();
          Helper.expectEither(
            (newProject) => {
              expect(R.keys(newProject.patches))
                .to.be.deep.equal(expectedPaths);
              expect(newProject.patches[expectedPath])
                .to.be.deep.equal(getCastPatch(typeIn, typeOut));
            },
            flatProject
          );
        });
      };
      testTypes(createCastInputTest);
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
            b: {
              id: 'b',
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
                nodeId: 'a',
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
      },
    };

    it('should return node b~b with injected pin a2', () => {
      const flatProject = flatten(project, '@/main', ['js']);

      expect(flatProject.isRight).to.be.true();
      Helper.expectEither(
        (newProject) => {
          // console.log(JSON.stringify(newProject));
          expect(newProject.patches['@/main'].nodes['b~b'])
            .to.have.property('pins')
            .that.deep.equal(project.patches['@/main'].nodes.b.pins);
        },
        flatProject
      );
    });
  });

  // Tests left:
  // - injected pins
  // - flatten with list of impls, check priority
});
