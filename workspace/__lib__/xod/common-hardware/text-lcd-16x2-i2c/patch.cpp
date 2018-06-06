
{{#global}}
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
{{/global}}

struct State {
    LiquidCrystal_I2C* lcd;
};

{{ GENERATED_CODE }}

void printLine(LiquidCrystal_I2C* lcd, uint8_t lineIndex, XString str) {
    lcd->setCursor(0, lineIndex);
    uint8_t whitespace = 16;
    for (auto it = str.iterate(); it; ++it, --whitespace)
        lcd->write(*it);

    // Clear the rest of the line
    while (whitespace--)
        lcd->write(' ');
}

void evaluate(Context ctx) {
    if (!isInputDirty<input_UPD>(ctx))
        return;

    State* state = getState(ctx);
    auto lcd = state->lcd;
    if (!state->lcd) {
        uint8_t addr = getValue<input_ADDR>(ctx);
        state->lcd = lcd = new LiquidCrystal_I2C(addr, 16, 2);
        lcd->begin();
    }

    printLine(lcd, 0, getValue<input_L1>(ctx));
    printLine(lcd, 1, getValue<input_L2>(ctx));
    lcd->setBacklight(getValue<input_BL>(ctx));
    emitValue<output_DONE>(ctx, 1);
}
