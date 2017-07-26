
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
            (int)getValue<Inputs::RS>(nid),
            (int)getValue<Inputs::EN>(nid),
            (int)getValue<Inputs::D4>(nid),
            (int)getValue<Inputs::D5>(nid),
            (int)getValue<Inputs::D6>(nid),
            (int)getValue<Inputs::D7>(nid));

        lcd->begin(16, 2);
    }

    printLine(lcd, 0, getValue<Inputs::L1>(nid));
    printLine(lcd, 1, getValue<Inputs::L2>(nid));
}
