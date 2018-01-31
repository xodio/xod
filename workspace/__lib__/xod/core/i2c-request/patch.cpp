
{{#global}}
#include <Wire.h>
{{/global}}

struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    if (!isInputDirty<input_SEND>(ctx))
        return;

    Wire.begin();

    auto addr = (uint8_t)getValue<input_ADDR>(ctx);
    auto nBytes = (uint8_t)getValue<input_N>(ctx);
    Wire.requestFrom(addr, nBytes);

    emitValue<output_DONE>(ctx, 1);
}
