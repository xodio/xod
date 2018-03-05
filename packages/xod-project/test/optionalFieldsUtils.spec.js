import R from 'ramda';
import { assert } from 'chai';

import { validateSanctuaryType } from 'xod-func-tools';

import { loadJSON } from './helpers';
import {
  Project,
  addMissingOptionalProjectFields,
  omitEmptyOptionalProjectFields,
} from '../src/index';

describe('Optional fields utils', () => {
  const omittedOptionals = loadJSON(
    './fixtures/with-omitted-optional-fields.xodball'
  );
  const emptyOptionals = loadJSON(
    './fixtures/with-empty-optional-fields.xodball'
  );

  describe('addMissingOptionalProjectFields', () => {
    it('takes a project with omitted optional fields and returns a valid Project', () => {
      const eitherValidProject = R.compose(
        validateSanctuaryType(Project),
        addMissingOptionalProjectFields
      )(omittedOptionals);

      assert(
        eitherValidProject.isRight,
        'Project validation must return Either.Right'
      );
    });
  });

  describe('omitEmptyOptionalProjectFields', () => {
    it('takes a "full" Project and omits optional fields', () => {
      assert.deepEqual(
        omitEmptyOptionalProjectFields(emptyOptionals),
        omittedOptionals
      );
    });
  });
});
