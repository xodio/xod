
{{#global}}
#include <Wire.h>
{{/global}}

struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    if (!isInputDirty<input_SEND>(ctx))
        return;

    Wire.write((uint8_t)getValue<input_BYTE>(ctx));
    emitValue<output_DONE>(ctx, 1);
}
