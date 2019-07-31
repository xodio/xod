#pragma XOD error_raise enable

{{#global}}
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
{{/global}}

struct State {
    uint8_t mem[sizeof(LiquidCrystal_I2C)];
};

struct Type {
    LiquidCrystal_I2C* lcd;
    uint8_t rows;
    uint8_t cols;
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    State* state = getState(ctx);

    uint8_t addr = getValue<input_ADDR>(ctx);
    uint8_t rows = (uint8_t) getValue<input_ROWS>(ctx);
    uint8_t cols = (uint8_t) getValue<input_COLS>(ctx);

    if (addr > 127) {
        raiseError(ctx);
        return;
    }

    Type t;
    t.rows = rows;
    t.cols = cols;
    t.lcd = new (state->mem) LiquidCrystal_I2C(addr, cols, rows);
    t.lcd->begin();

    emitValue<output_DEV>(ctx, t);
}
