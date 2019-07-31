#pragma XOD error_raise enable

{{#global}}
#include <LiquidCrystal.h>
{{/global}}

struct State {
    uint8_t mem[sizeof(LiquidCrystal)];
};

struct Type {
    LiquidCrystal* lcd;
    uint8_t rows;
    uint8_t cols;
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    State* state = getState(ctx);

    uint8_t rows = (uint8_t) getValue<input_ROWS>(ctx);
    uint8_t cols = (uint8_t) getValue<input_COLS>(ctx);

    Type t;
    t.rows = rows;
    t.cols = cols;
    t.lcd = new (state->mem) LiquidCrystal(
        (int)getValue<input_RS>(ctx),
        (int)getValue<input_EN>(ctx),
        (int)getValue<input_D4>(ctx),
        (int)getValue<input_D5>(ctx),
        (int)getValue<input_D6>(ctx),
        (int)getValue<input_D7>(ctx));
    t.lcd->begin(t.cols, t.rows);

    emitValue<output_DEV>(ctx, t);
}
