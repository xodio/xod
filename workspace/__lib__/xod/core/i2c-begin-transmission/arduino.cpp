
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
    Wire.beginTransmission((uint8_t)getValue<input_ADDR>(ctx));

    emitValue<output_DONE>(ctx, 1);
}
