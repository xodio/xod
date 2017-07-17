import R from 'ramda';
import { assert } from 'chai';

import {
  Project,
  addMissingOptionalProjectFields,
  omitEmptyOptionalProjectFields,
} from '../src/index';

import xodballWithOmittedOptionals from './fixtures/with-omitted-optional-fields.json';
import xodballWithEmptyOptionals from './fixtures/with-empty-optional-fields.json';

describe('addMissingOptionalProjectFields', () => {
  it('takes a project with omitted optional fields and returns a valid Project', () => {
    const eitherValidProject = R.compose(
      Project.validate.bind(Project),
      addMissingOptionalProjectFields
    )(xodballWithOmittedOptionals);

    assert(
      eitherValidProject.isRight,
      'Project validation must return Either.Right'
    );
  });
});

describe('omitEmptyOptionalProjectFields', () => {
  it('takes a "full" Project and omits optional fields', () => {
    assert.deepEqual(
      omitEmptyOptionalProjectFields(xodballWithEmptyOptionals),
      xodballWithOmittedOptionals
    );
  });
});
