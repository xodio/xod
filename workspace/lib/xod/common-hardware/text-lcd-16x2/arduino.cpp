
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

void evaluate(NodeId nid) {
    State* state = getState(nid);
    auto lcd = state->lcd;
    if (!state->lcd) {
        state->lcd = lcd = new LiquidCrystal(
            (int)getValue<input_RS>(nid),
            (int)getValue<input_EN>(nid),
            (int)getValue<input_D4>(nid),
            (int)getValue<input_D5>(nid),
            (int)getValue<input_D6>(nid),
            (int)getValue<input_D7>(nid));

        lcd->begin(16, 2);
    }

    printLine(lcd, 0, getValue<input_L1>(nid));
    printLine(lcd, 1, getValue<input_L2>(nid));
}
