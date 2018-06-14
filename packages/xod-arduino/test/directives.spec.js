import { assert } from 'chai';

import {
  isDirtienessEnabled,
  isNodeIdEnabled,
  areTimeoutsEnabled,
  stripCppComments,
  findXodPragmas,
} from '../src/directives';

describe('Stripping C++ comments', () => {
  function assertStrippedEqual(code, expected) {
    assert.strictEqual(
      stripCppComments(code),
      expected,
      'Stripped code does not match expectation'
    );
  }

  it('leaves code as is when no comments', () => {
    const code = `
      #define FOO 42
      int main() {
        return 0;
      }
      `;

    assertStrippedEqual(code, code);
  });

  it('strips line comments', () => {
    const code = `
      // Hello
      const int a = 42; // I’m a variable
      `;

    const expected = `
      const int a = 42;
      `;

    assertStrippedEqual(code, expected);
  });

  it('strips block comments', () => {
    const code = `
      /* Hello */
      /**
       * Hi there
       */
      const int a = 42; /* I’m a variable
        with a long long history
      */
      `;

    const expected = `

      const int a = 42;
      `;

    assertStrippedEqual(code, expected);
  });

  it('strips nested block comments', () => {
    const code = `
      /* Hello
      /**
       * Hi there
       */
      const int a = 42;
      I’m an improperly nested comment */
      `;

    const expected = `
      const int a = 42;
      I’m an improperly nested comment */
      `;

    assertStrippedEqual(code, expected);
  });

  it('strips mixed comments', () => {
    const code = `
      /* Hello
      // Attempt to comment out end of block comment */
      const int a = 42;
      // Comment out block start /*
      I’m an improperly nested comment */
      `;

    const expected = `
      const int a = 42;
      I’m an improperly nested comment */
      `;

    assertStrippedEqual(code, expected);
  });
});

describe('Search for #pragma XOD', () => {
  function assertPragmasFound(code, expected) {
    assert.deepEqual(findXodPragmas(code), expected);
  }

  it('returns empty list if not found', () => {
    const code = `
      #include <Arduino.h>
      // hello
      void setup() {
      }

      void loop() {
      }
      `;

    assertPragmasFound(code, []);
  });

  it('finds only XOD-specific pragmas', () => {
    const code = `
      #include <Arduino.h>
      #pragma GCC diagnostic error '-Wall'
      #pragma XOD foo bar baz
      #pragma XOD digun liteta
      `;

    assertPragmasFound(code, [['foo', 'bar', 'baz'], ['digun', 'liteta']]);
  });

  it('finds tricky pragmas', () => {
    const code = `
      #  pragma XOD foo bar baz
      #pragma   XOD       digun liteta
      //#pragma XOD commented out
      `;

    assertPragmasFound(code, [['foo', 'bar', 'baz'], ['digun', 'liteta']]);
  });

  it('considers enquoted arguments atomic', () => {
    assertPragmasFound('#pragma XOD foo "bar baz" qux', [
      ['foo', 'bar baz', 'qux'],
    ]);
  });

  it('considers - _ . a non-breaking character', () => {
    assertPragmasFound('#pragma XOD foo.bar baz-qux_kut', [
      ['foo.bar', 'baz-qux_kut'],
    ]);
  });
});

describe('Timeouts', () => {
  it('are disabled by default', () => {
    const code = `
      void setup() {
      }

      void loop() {
      }
      `;

    assert.equal(areTimeoutsEnabled(code), false);
  });

  it('auto-enabled when setTimeout is found', () => {
    const code = `
      void evaluate(Context ctx) {
        setTimeout(ctx, 42);
      }
      `;

    assert.equal(areTimeoutsEnabled(code), true);
  });

  it('can be enabled explicitly', () => {
    const code = `
      #pragma XOD timeouts enable

      void evaluate(Context ctx) {
        int x = 42;
      }
      `;

    assert.equal(areTimeoutsEnabled(code), true);
  });

  it('can be disabled explicitly', () => {
    const code = `
      #pragma XOD timeouts disable
      #include <SomeLibrary.h>
      void evaluate(Context ctx) {
        SomeArduinoLibObject.setTimeout("has nothing to do with XOD’s timeouts")
      }
      `;

    assert.equal(areTimeoutsEnabled(code), false);
  });
});

describe('Node ID', () => {
  it('is disabled by default', () => {
    const code = `
      void evaluate(Context ctx) {
      }
      `;

    assert.equal(isNodeIdEnabled(code), false);
  });

  it('auto-enabled when getNodeId is found', () => {
    const code = `
      void evaluate(Context ctx) {
        auto nodeId = getNodeId(ctx);
      }
      `;

    assert.equal(isNodeIdEnabled(code), true);
  });

  it('can be enabled explicitly', () => {
    const code = `
      #pragma XOD nodeid enable

      void evaluate(Context ctx) {
        int x = 42;
      }
      `;

    assert.equal(isNodeIdEnabled(code), true);
  });

  it('can be disabled explicitly', () => {
    const code = `
      #pragma XOD nodeid disable
      #include <SomeLibrary.h>
      void evaluate(Context ctx) {
        SomeArduinoLibObject.getNodeId("has nothing to do with XOD’s node ids")
      }
      `;

    assert.equal(areTimeoutsEnabled(code), false);
  });
});

describe('Dirtieness', () => {
  it('enabled on outputs and disabled on inputs by default', () => {
    const code = `
      void evaluate(Context ctx) {
      }
      `;

    assert.equal(isDirtienessEnabled(code, 'input_FOO'), false);
    assert.equal(isDirtienessEnabled(code, 'output_BAR'), true);
  });

  it('auto-enabled on inputs when found in code', () => {
    const code = `
      void evaluate(Context ctx) {
        bool isDirtyFoo = isInputDirty<input_FOO>(ctx);
        bool isDirtyBar = isInputDirty<   input_BAR /* hello */>(ctx);
      }
      `;

    assert.equal(isDirtienessEnabled(code, 'input_FOO'), true);
    assert.equal(isDirtienessEnabled(code, 'input_BAR'), true);
  });

  it('can be disabled for all pins at once', () => {
    const code = `
      #pragma XOD dirtieness disable
      void evaluate(Context ctx) {
        bool isDirtyFoo = isInputDirty<input_FOO>(ctx);
      }
      `;

    assert.equal(isDirtienessEnabled(code, 'input_FOO'), false);
    assert.equal(isDirtienessEnabled(code, 'output_BAR'), false);
  });

  it('can be enabled for all pins at once', () => {
    const code = `
      #pragma XOD dirtieness enable
      void evaluate(Context ctx) {
      }
      `;

    assert.equal(isDirtienessEnabled(code, 'input_FOO'), true);
    assert.equal(isDirtienessEnabled(code, 'output_BAR'), true);
  });

  it('can be controlled individually', () => {
    const code = `
      #pragma XOD dirtieness enable input_FOO
      #pragma XOD dirtieness disable output_QUX
      void evaluate(Context ctx) {
      }
      `;

    assert.equal(isDirtienessEnabled(code, 'input_FOO'), true);
    assert.equal(isDirtienessEnabled(code, 'input_BAR'), false);
    assert.equal(isDirtienessEnabled(code, 'output_QUX'), false);
  });

  it('supports cascading', () => {
    const code = `
      #pragma XOD dirtieness disable
      #pragma XOD dirtieness enable input_FOO
      #pragma XOD dirtieness disable input_FOO
      #pragma XOD dirtieness enable
      void evaluate(Context ctx) {
      }
      `;

    assert.equal(isDirtienessEnabled(code, 'input_FOO'), true);
  });
});
