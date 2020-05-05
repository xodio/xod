#pragma XOD evaluate_on_pin disable
#pragma XOD evaluate_on_pin enable input_UPD

{{#global}}
#include <LiquidCrystal.h>
{{/global}}

struct State {
    LiquidCrystal* lcd;
};

{{ GENERATED_CODE }}

void printLine(LiquidCrystal* lcd, uint8_t lineIndex, XString str) {
    lcd->setCursor(0, lineIndex);
    uint8_t whitespace = 16;
    for (auto it = str->iterate(); it; ++it, --whitespace)
        lcd->write(*it);

    // Clear the rest of the line
    while (whitespace--)
        lcd->write(' ');
}

void evaluate(Context ctx) {
    static_assert(isValidDigitalPort(constant_input_RS), "must be a valid digital port");
    static_assert(isValidDigitalPort(constant_input_EN), "must be a valid digital port");
    static_assert(isValidDigitalPort(constant_input_D4), "must be a valid digital port");
    static_assert(isValidDigitalPort(constant_input_D5), "must be a valid digital port");
    static_assert(isValidDigitalPort(constant_input_D6), "must be a valid digital port");
    static_assert(isValidDigitalPort(constant_input_D7), "must be a valid digital port");

    if (!isInputDirty<input_UPD>(ctx))
        return;

    State* state = getState(ctx);
    auto lcd = state->lcd;
    if (!state->lcd) {
        auto rsPort = getValue<input_RS>(ctx);
        auto enPort = getValue<input_EN>(ctx);
        auto d4Port = getValue<input_D4>(ctx);
        auto d5Port = getValue<input_D5>(ctx);
        auto d6Port = getValue<input_D6>(ctx);
        auto d7Port = getValue<input_D7>(ctx);

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

    emitValue<output_DONE>(ctx, 1);
}
