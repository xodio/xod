import { assert } from 'chai';
import { Either } from 'ramda-fantasy';

import * as Helper from './helpers';
import {
  getPatchByPathUnsafe,
  assocPatchUnsafe,
  listGenuinePatches,
} from '../src/project';
import { PIN_TYPE } from '../src/constants';

import { autoresolveTypes, deducePinTypes } from '../src';

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

  it('does not include types of non-generic pins in the results', () => {
    const deduced = deducePinTypes(
      getPatchByPathUnsafe('@/case5-generics-with-static-terminals', project),
      project
    );

    const expected = {
      genericWithStatics1: {
        inT1: Either.Right(PIN_TYPE.NUMBER),
        outT1: Either.Right(PIN_TYPE.NUMBER),
      },
      genericWithStatics2: {
        inT1: Either.Right(PIN_TYPE.NUMBER),
        outT1: Either.Right(PIN_TYPE.NUMBER),
      },
      genericWithStatics3: {
        inT1: Either.Right(PIN_TYPE.NUMBER),
        outT1: Either.Right(PIN_TYPE.NUMBER),
      },
    };

    assert.deepEqual(deduced, expected);
  });

  it('deduces types of patches composed from other generics', () => {
    const deduced = deducePinTypes(
      getPatchByPathUnsafe('@/case6-patches-composed-from-generics', project),
      project
    );

    const expected = {
      gen1: {
        inT1: Either.Right(PIN_TYPE.STRING),
        outT1: Either.Right(PIN_TYPE.STRING),
      },
      wrappedGen1: {
        inT1_1: Either.Right(PIN_TYPE.STRING),
        inT1_2: Either.Right(PIN_TYPE.STRING),
        outT1: Either.Right(PIN_TYPE.STRING),
      },
      wrappedGen2: {
        inT1_1: Either.Right(PIN_TYPE.STRING),
        inT1_2: Either.Right(PIN_TYPE.STRING),
        outT1: Either.Right(PIN_TYPE.STRING),
      },
      gen2: {
        inT1: Either.Right(PIN_TYPE.NUMBER),
        outT1: Either.Right(PIN_TYPE.NUMBER),
      },
      wrappedGen3: {
        inT1_1: Either.Right(PIN_TYPE.NUMBER),
        inT1_2: Either.Right(PIN_TYPE.NUMBER),
        outT1: Either.Right(PIN_TYPE.NUMBER),
      },
      wrappedGen4: {
        inT1_1: Either.Right(PIN_TYPE.NUMBER),
        inT1_2: Either.Right(PIN_TYPE.NUMBER),
        outT1: Either.Right(PIN_TYPE.NUMBER),
      },
    };

    assert.deepEqual(deduced, expected);
  });

  it('deduces types of variadic generic nodes', () => {
    const deduced = deducePinTypes(
      getPatchByPathUnsafe('@/case7-variadic-generics', project),
      project
    );

    const expected = {
      gen1: {
        inT1_1: Either.Right(PIN_TYPE.NUMBER),
        inT1_2: Either.Right(PIN_TYPE.NUMBER),
        'inT1_2-$1': Either.Right(PIN_TYPE.NUMBER),
        'inT1_2-$2': Either.Right(PIN_TYPE.NUMBER),
        outT1: Either.Right(PIN_TYPE.NUMBER),
      },
      gen2: {
        inT1_1: Either.Right(PIN_TYPE.NUMBER),
        inT1_2: Either.Right(PIN_TYPE.NUMBER),
        'inT1_2-$1': Either.Right(PIN_TYPE.NUMBER),
        'inT1_2-$2': Either.Right(PIN_TYPE.NUMBER),
        outT1: Either.Right(PIN_TYPE.NUMBER),
      },
      gen3: {
        inT1_1: Either.Right(PIN_TYPE.STRING),
        inT1_2: Either.Right(PIN_TYPE.STRING),
        'inT1_2-$1': Either.Right(PIN_TYPE.STRING),
        'inT1_2-$2': Either.Right(PIN_TYPE.STRING),
        outT1: Either.Right(PIN_TYPE.STRING),
      },
      gen4: {
        inT1_1: Either.Right(PIN_TYPE.STRING),
        inT1_2: Either.Right(PIN_TYPE.STRING),
        'inT1_2-$1': Either.Right(PIN_TYPE.STRING),
        'inT1_2-$2': Either.Right(PIN_TYPE.STRING),
        outT1: Either.Right(PIN_TYPE.STRING),
      },
    };

    assert.deepEqual(deduced, expected);
  });
});

describe('autoresolveTypes', () => {
  const project = Helper.loadXodball(
    './fixtures/abstract-nodes-resolution.xodball'
  );
  it('successfully resolves types for a valid project', () => {
    const expectedResolvedProject = Helper.loadXodball(
      './fixtures/abstract-nodes-resolution.resolved.xodball'
    );

    Helper.expectEitherRight(actualResolvedProject => {
      assert.sameDeepMembers(
        listGenuinePatches(actualResolvedProject),
        listGenuinePatches(expectedResolvedProject)
      );
    }, autoresolveTypes('@/case1-ok', project));
  });
  it('detects missing specializations', () => {
    Helper.expectEitherError(
      'CANT_FIND_SPECIALIZATIONS_FOR_ABSTRACT_PATCH {"patchPath":"@/pulse-on-change","expectedSpecializationName":"pulse-on-change(string)","trace":["@/case2-missing-specialization","@/when-either-changes(boolean,string)"]}',
      autoresolveTypes('@/case2-missing-specialization', project)
    );
  });
  it('detects conflicting specializations', () => {
    const conflictingSpecialization = getPatchByPathUnsafe(
      '@/pulse-on-change(number)',
      project
    );
    const projectWithConflictingSpecialization = assocPatchUnsafe(
      'some/other-library/pulse-on-change(number)',
      conflictingSpecialization,
      project
    );

    Helper.expectEitherError(
      'CONFLICTING_SPECIALIZATIONS_FOR_ABSTRACT_PATCH {"patchPath":"@/pulse-on-change","conflictingSpecializations":["@/pulse-on-change(number)","some/other-library/pulse-on-change(number)"],"trace":["@/case1-ok","@/when-either-changes(boolean,number)"]}',
      autoresolveTypes('@/case1-ok', projectWithConflictingSpecialization)
    );
  });
  it('does not lose links from/to variadic patches', () => {
    const expectedResolvedProject = Helper.loadXodball(
      './fixtures/abstract-nodes-resolution.resolved-variadics.xodball'
    );

    Helper.expectEitherRight(actualResolvedProject => {
      assert.sameDeepMembers(
        listGenuinePatches(actualResolvedProject),
        listGenuinePatches(expectedResolvedProject)
      );
    }, autoresolveTypes('@/case3-variadics', project));
  });
  it('does not lose values bound to non-generic pins', () => {
    const expectedResolvedProject = Helper.loadXodball(
      './fixtures/abstract-nodes-resolution.resolved-bound-nongenerics.xodball'
    );

    Helper.expectEitherRight(actualResolvedProject => {
      assert.sameDeepMembers(
        listGenuinePatches(actualResolvedProject),
        listGenuinePatches(expectedResolvedProject)
      );
    }, autoresolveTypes('@/case4-bound-non-generic-pins', project));
  });
  it('resolves abstract nodes in patches that have no generic inputs', () => {
    const expectedResolvedProject = Helper.loadXodball(
      './fixtures/abstract-nodes-resolution.resolved-abstracts-inside-regular.xodball'
    );

    Helper.expectEitherRight(actualResolvedProject => {
      assert.sameDeepMembers(
        listGenuinePatches(actualResolvedProject),
        listGenuinePatches(expectedResolvedProject)
      );
    }, autoresolveTypes('@/case5-abstracts-deep-inside-regular-patches', project));
  });

  it('resolves custom types on generics', () => {
    const projectWithCustomTypes = Helper.loadXodball(
      './fixtures/custom-types.xodball'
    );

    const expectedResolvedProject = Helper.loadXodball(
      './fixtures/custom-types.resolved.xodball'
    );

    Helper.expectEitherRight(actualResolvedProject => {
      assert.sameDeepMembers(
        listGenuinePatches(actualResolvedProject),
        listGenuinePatches(expectedResolvedProject)
      );
    }, autoresolveTypes('@/main', projectWithCustomTypes));
  });
});
