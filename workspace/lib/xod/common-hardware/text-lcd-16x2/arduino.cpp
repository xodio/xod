
{{#global}}
#include <LiquidCrystal.h>
{{/global}}

struct State {
    LiquidCrystal* lcd;
};

{{ GENERATED_CODE }}

void printLine(LiquidCrystal* lcd, uint8_t lineIndex, XString str) {
    if (!str)
        return;

    lcd->setCursor(0, lineIndex);
    for (auto it = str->iterate(); it; ++it)
        lcd->write(*it);
}

void evaluate(Context ctx) {
    State* state = getState(ctx);
    auto lcd = state->lcd;
    if (!state->lcd) {
        state->lcd = lcd = new LiquidCrystal(
            (int)getValue<input_RS>(ctx),
            (int)getValue<input_EN>(ctx),
            (int)getValue<input_D4>(ctx),
            (int)getValue<input_D5>(ctx),
            (int)getValue<input_D6>(ctx),
            (int)getValue<input_D7>(ctx));

        lcd->begin(16, 2);
    }

    printLine(lcd, 0, getValue<input_L1>(ctx));
    printLine(lcd, 1, getValue<input_L2>(ctx));
}
