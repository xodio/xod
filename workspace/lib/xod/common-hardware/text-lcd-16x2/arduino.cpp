
{{#global}}
#include <LiquidCrystal.h>
{{/global}}

LiquidCrystal lcd(8, 9, 10, 11, 12, 13);

struct State {
    bool begun = false;
};

{{ GENERATED_CODE }}

void evaluate(NodeId nid, State* state) {
    if (!isInputDirty<Inputs::UPD>(nid))
      return;

    if (!state->begun) {
      lcd.begin(16, 2);
      state->begun = true;
    }

    XString line;

    line = getValue<Inputs::L1>(nid);
    if (line) {
      lcd.setCursor(0, 0);
      for (auto it = line->iterate(); it; ++it) {
        lcd.write(*it);
      }
    }

    line = getValue<Inputs::L2>(nid);
    if (line) {
      lcd.setCursor(0, 1);
      for (auto it = line->iterate(); it; ++it) {
        lcd.write(*it);
      }
    }
}
