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
    describe('typeA to outputTypeB', () => {
      const createCastOutputTest = (typeIn, typeOut) => {
        it(getCastPath(typeIn, typeOut), () => {
          const project = {
            patches: {
              '@/main': {
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
          const flatProject = flatten(project, '@/main', ['js']);
          const expectedPath = getCastPath(typeIn, typeOut);

          expect(flatProject.isRight).to.be.true();
          Helper.expectEither(
            (newProject) => {
              expect(R.keys(newProject.patches))
                .to.be.deep.equal([`xod/core/${typeIn}`, expectedPath, '@/main']);
              expect(newProject.patches[expectedPath])
                .to.be.deep.equal(getCastPatch(typeIn, typeOut));
            },
            flatProject
          );
        });
      };
      testTypes(createCastOutputTest);
    });

    describe('inputTypeA to typeB', () => {
      // inputX to Y
      const createCastInputTest = (typeIn, typeOut) => {
        it(getCastPath(typeIn, typeOut), () => {
          const project = {
            patches: {
              '@/main': {
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
                    type: typeIn,
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
              'xod/core/inputX': {
                nodes: {},
                links: {},
                pins: {
                  __out__: {
                    key: '__out__',
                    type: typeIn,
                    direction: 'output',
                  },
                },
              },
            },
          };
          const flatProject = flatten(project, '@/main', ['js']);
          const expectedPath = getCastPath(typeIn, typeOut);

          expect(flatProject.isRight).to.be.true();
          Helper.expectEither(
            (newProject) => {
              expect(R.keys(newProject.patches))
                .to.be.deep.equal([`xod/core/${typeOut}`, expectedPath, '@/main']);
              expect(newProject.patches[expectedPath])
                .to.be.deep.equal(getCastPatch(typeIn, typeOut));
            },
            flatProject
          );
        });
      };
      testTypes(createCastInputTest);
    });

    describe('typeA to inputTypeB to typeA', () => {
      // inputX to Y
      const createCastInputTest = (typeIn, typeOut) => {
        it(getCastPath(typeIn, typeOut), () => {
          const project = {
            patches: {
              '@/main': {
                nodes: {
                  a: {
                    id: 'a',
                    type: `xod/core/out${typeIn}`,
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
                    type: `xod/core/${typeIn}`,
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
              [`xod/core/${typeIn}`]: {
                nodes: {},
                links: {},
                pins: {
                  in: {
                    key: 'in',
                    type: typeIn,
                    direction: 'input',
                  },
                },
                impls: {
                  js: '//OK',
                },
              },
              [`xod/core/out${typeIn}`]: {
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
          const flatProject = flatten(project, '@/main', ['js']);
          const expectedPath = getCastPath(typeIn, typeOut);

          expect(flatProject.isRight).to.be.true();
          Helper.expectEither(
            (newProject) => {
              expect(R.keys(newProject.patches))
                .to.be.deep.equal([`xod/core/out${typeIn}`, `xod/core/${typeIn}`, expectedPath, '@/main']);
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
});
