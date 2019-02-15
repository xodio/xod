import * as R from 'ramda';
import { assert } from 'chai';
import { Maybe } from 'ramda-fantasy';
import { explode } from 'xod-func-tools';

import { PIN_TYPE } from '../src/constants';
import {
  ensureLiteral,
  migrateBoundValuesToBoundLiterals,
} from '../src/migrations/boundValuesToBoundLiterals';
import { listLocalPatches } from '../src/project';
import { listNodes } from '../src/patch';
import * as Helper from './helpers';

assert.strictEqualJustValue = (actual, expected) => {
  if (Maybe.isNothing(actual)) {
    assert.fail(
      `Expect Maybe.Just with '${expected}' value, but got Maybe.Nothing`
    );
  }
  const val = explode(actual);
  assert.strictEqual(val, expected);
};

describe('Migration: bound values to bound literals', () => {
  describe('ensureLiteral', () => {
    it('returns Maybe.Just Literal for Boolean types', () => {
      // DataValue -> Literal
      assert.strictEqualJustValue(
        ensureLiteral(PIN_TYPE.BOOLEAN, true),
        'True'
      );
      assert.strictEqualJustValue(
        ensureLiteral(PIN_TYPE.BOOLEAN, false),
        'False'
      );
      // Literal -> Literal
      assert.strictEqualJustValue(
        ensureLiteral(PIN_TYPE.BOOLEAN, 'True'),
        'True'
      );
      assert.strictEqualJustValue(
        ensureLiteral(PIN_TYPE.BOOLEAN, 'False'),
        'False'
      );
    });
    it('returns Maybe.Just Literal for Number types', () => {
      // DataValue -> Literal
      assert.strictEqualJustValue(
        ensureLiteral(PIN_TYPE.NUMBER, 0.312),
        '0.312'
      );
      assert.strictEqualJustValue(ensureLiteral(PIN_TYPE.NUMBER, 42), '42');
      assert.strictEqualJustValue(
        ensureLiteral(PIN_TYPE.NUMBER, -42.15),
        '-42.15'
      );
      // Literal -> Literal
      assert.strictEqualJustValue(
        ensureLiteral(PIN_TYPE.NUMBER, '0.312'),
        '0.312'
      );
      assert.strictEqualJustValue(ensureLiteral(PIN_TYPE.NUMBER, '42'), '42');
      assert.strictEqualJustValue(
        ensureLiteral(PIN_TYPE.NUMBER, '-42.15'),
        '-42.15'
      );
    });
    it('returns Maybe.Just Literal for Pulse types', () => {
      // DataValue -> Literal
      // Old default value for "Never" pulse value was just `false`
      assert.strictEqualJustValue(
        ensureLiteral(PIN_TYPE.PULSE, false),
        'Never'
      );
      // Sometimes Never was a string "false"
      // when User binds `Never` to terminal in the Inspector
      assert.strictEqualJustValue(
        ensureLiteral(PIN_TYPE.PULSE, 'false'),
        'Never'
      );
      assert.strictEqualJustValue(
        ensureLiteral(PIN_TYPE.PULSE, 'NEVER'),
        'Never'
      );
      assert.strictEqualJustValue(
        ensureLiteral(PIN_TYPE.PULSE, 'CONTINUOUSLY'),
        'Continuously'
      );
      assert.strictEqualJustValue(
        ensureLiteral(PIN_TYPE.PULSE, 'ON_BOOT'),
        'On Boot'
      );
      // Literal -> Literal
      assert.strictEqualJustValue(
        ensureLiteral(PIN_TYPE.PULSE, 'Never'),
        'Never'
      );
      assert.strictEqualJustValue(
        ensureLiteral(PIN_TYPE.PULSE, 'Continuously'),
        'Continuously'
      );
      assert.strictEqualJustValue(
        ensureLiteral(PIN_TYPE.PULSE, 'On Boot'),
        'On Boot'
      );
    });
    it('returns Maybe.Just Literal for String types', () => {
      // DataValue -> Literal
      assert.strictEqualJustValue(ensureLiteral(PIN_TYPE.STRING, ''), '""');
      assert.strictEqualJustValue(
        ensureLiteral(PIN_TYPE.STRING, 'Hello'),
        '"Hello"'
      );
      assert.strictEqualJustValue(
        ensureLiteral(PIN_TYPE.STRING, 'And he said "Hello, World"'),
        '"And he said "Hello, World""'
      );
      assert.strictEqualJustValue(
        ensureLiteral(PIN_TYPE.STRING, '36.6'),
        '"36.6"'
      );
      assert.strictEqualJustValue(
        ensureLiteral(PIN_TYPE.STRING, 'true'),
        '"true"'
      );
      // Literal -> Literal
      assert.strictEqualJustValue(ensureLiteral(PIN_TYPE.STRING, '""'), '""');
      assert.strictEqualJustValue(
        ensureLiteral(PIN_TYPE.STRING, '"Hello"'),
        '"Hello"'
      );
      assert.strictEqualJustValue(
        ensureLiteral(PIN_TYPE.STRING, '"And he said "Hello, World""'),
        '"And he said "Hello, World""'
      );
      assert.strictEqualJustValue(
        ensureLiteral(PIN_TYPE.STRING, '"36.6"'),
        '"36.6"'
      );
      assert.strictEqualJustValue(
        ensureLiteral(PIN_TYPE.STRING, '"true"'),
        '"true"'
      );
    });
    it('returns Maybe.Just Literal for unknown type with value type of number', () => {
      // DataValue -> Literal
      assert.strictEqualJustValue(ensureLiteral(PIN_TYPE.DEAD, 3), '3');
    });
    it('returns Maybe.Nothing if can not convert value', () => {
      // DEAD type used, to avoid error throwing by hm-def
      // Also, DEAD pin could not have a bound value, cause it created
      // by a dead link to unexisting Pin.
      const res = ensureLiteral(PIN_TYPE.DEAD, '732');
      assert.isTrue(Maybe.isNothing(res));
    });
  });

  describe('migrateBoundValuesToBoundLiterals', () => {
    // New Project should not contain any Node with old property
    // `boundValues`, instead of it all Nodes should have `boundLiterals`
    it('returns fully migrated Project', () => {
      const blinking = Helper.loadXodball(
        './fixtures/legacy-bound-values.xodball'
      );
      const migrated = migrateBoundValuesToBoundLiterals(blinking);
      const isThereAnyBoundValues = R.compose(
        R.any(R.pipe(listNodes, R.any(R.has('boundValues')))),
        listLocalPatches
      )(migrated);

      assert.isFalse(isThereAnyBoundValues);
    });
    it('returns partially migrated Project if it contains not installed libs', () => {
      const blinking = Helper.loadXodball(
        './fixtures/legacy-bound-values.no-installed-libs.xodball'
      );
      const migrated = migrateBoundValuesToBoundLiterals(blinking);
      const nodes = R.pick([
        'button',
        'thirdparty-nums',
        'thirdparty-strings',
        'thirdparty-mixed',
      ])(migrated.patches['@/main'].nodes);

      // `button` should be fully converted, cause it contains only numbers
      assert.containsAllKeys(
        nodes.button,
        ['boundLiterals'],
        '`button` node does not contain `boundLiterals`'
      );
      assert.doesNotHaveAnyKeys(
        nodes.button,
        ['boundValues'],
        '`button` node contains `boundValues`'
      );

      // `thirdparty-nums` should be fully converted, cause it contains only numbers
      assert.containsAllKeys(
        nodes['thirdparty-nums'],
        ['boundLiterals'],
        '`thirdparty-nums` node does not contain `boundLiterals`'
      );
      assert.doesNotHaveAnyKeys(
        nodes['thirdparty-nums'],
        ['boundValues'],
        '`thirdparty-nums` node contains `boundValues`'
      );

      // `thirdparty-strings` should be left with unconverted boundValues
      assert.containsAllKeys(
        nodes['thirdparty-strings'],
        ['boundValues'],
        '`thirdparty-strings` does not node contain `boundValues`'
      );

      // `thirdparty-mixed` should be left with unconverted boundValues
      assert.containsAllKeys(nodes['thirdparty-mixed'], [
        'boundValues',
        'boundLiterals',
      ]);
      // will be converted:
      assert.containsAllKeys(nodes['thirdparty-mixed'].boundLiterals, ['num']);
      // will not be converted:
      assert.containsAllKeys(nodes['thirdparty-mixed'].boundValues, [
        's',
        'p1',
        'p2',
      ]);
    });
  });
});
