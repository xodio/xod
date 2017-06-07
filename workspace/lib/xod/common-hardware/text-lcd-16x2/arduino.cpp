
{{#global}}
#include <LiquidCrystal.h>
{{/global}}

struct State {
    LiquidCrystal* lcd;
};

{{ GENERATED_CODE }}

void evaluate(NodeId nid, State* state) {
    if (!isInputDirty<Inputs::UPD>(nid))
        return;

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

    XString line;

    line = getValue<Inputs::L1>(nid);
    if (line) {
        lcd->setCursor(0, 0);
        for (auto it = line->iterate(); it; ++it) {
            lcd->write(*it);
        }
    }

    line = getValue<Inputs::L2>(nid);
    if (line) {
        lcd->setCursor(0, 1);
        for (auto it = line->iterate(); it; ++it) {
            lcd->write(*it);
        }
    }
}
