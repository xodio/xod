import { assert } from 'chai';
import { Either } from 'ramda-fantasy';

import * as Helper from './helpers';

import { getPatchByPathUnsafe } from '../src/project';
import { PIN_TYPE } from '../src/constants';
import { deducePinTypes } from '../src/typeDeduction';

describe('deducePinTypes', () => {
  const project = Helper.loadXodball('./fixtures/pin-types-deduction.xodball');

  it('deduces pin types from concrete nodes linked to generic inputs', () => {
    const deduced = deducePinTypes(
      getPatchByPathUnsafe('@/case1-top-to-bottom', project),
      project
    );

    const expected = {
      gen1_1to1: {
        inT1: Either.Right(PIN_TYPE.NUMBER),
        outT1: Either.Right(PIN_TYPE.NUMBER),
      },
      gen2_ptp: {
        inT1: Either.Right(PIN_TYPE.NUMBER),
        outT1: Either.Right(PIN_TYPE.NUMBER),
      },
      gen3_1to1: {
        inT1: Either.Right(PIN_TYPE.NUMBER),
        outT1: Either.Right(PIN_TYPE.NUMBER),
      },
    };

    assert.deepEqual(deduced, expected);
  });

  it('deduces pin types from concrete nodes linked to generic inputs', () => {
    const deduced = deducePinTypes(
      getPatchByPathUnsafe('@/case2-bottom-to-top', project),
      project
    );

    const expected = {
      gen1_1to1: {
        inT1: Either.Right(PIN_TYPE.NUMBER),
        outT1: Either.Right(PIN_TYPE.NUMBER),
      },
      gen2_ptp: {
        inT1: Either.Right(PIN_TYPE.NUMBER),
        outT1: Either.Right(PIN_TYPE.NUMBER),
      },
      gen3_1to1: {
        inT1: Either.Right(PIN_TYPE.NUMBER),
        outT1: Either.Right(PIN_TYPE.NUMBER),
      },
    };

    assert.deepEqual(deduced, expected);
  });

  it('detects conflicts when several outputs with different types are linked to inputs of the same generic type', () => {
    const deduced = deducePinTypes(
      getPatchByPathUnsafe('@/case3-top-to-bottom-invalid', project),
      project
    );

    const expected = {
      gen1_healthy: {
        inT1: Either.Right(PIN_TYPE.NUMBER),
        outT1: Either.Right(PIN_TYPE.NUMBER),
      },
      gen2_broken: {
        inT1_1: Either.Left([PIN_TYPE.NUMBER, PIN_TYPE.STRING]),
        inT1_2: Either.Left([PIN_TYPE.NUMBER, PIN_TYPE.STRING]),
      },
      gen4_unaffected_healthy: {
        inT1: Either.Right(PIN_TYPE.NUMBER),
        outT1: Either.Right(PIN_TYPE.NUMBER),
      },
    };

    assert.deepEqual(deduced, expected);
  });

  it('detects conflicts when several inputs with different types are linked to outputs of the same generic type', () => {
    const deduced = deducePinTypes(
      getPatchByPathUnsafe('@/case4-bottom-to-top-invalid', project),
      project
    );

    const expected = {
      gen2_broken: {
        outT1: Either.Left([PIN_TYPE.NUMBER, PIN_TYPE.STRING]),
      },
      gen4_broken: {
        outT1_1: Either.Left([PIN_TYPE.STRING, PIN_TYPE.NUMBER]),
        outT1_2: Either.Left([PIN_TYPE.STRING, PIN_TYPE.NUMBER]),
      },
      gen5_unaffected: {
        inT1: Either.Right(PIN_TYPE.NUMBER),
        outT1: Either.Right(PIN_TYPE.NUMBER),
      },
    };

    assert.deepEqual(deduced, expected);
  });
});
