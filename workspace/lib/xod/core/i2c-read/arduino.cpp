
{{#global}}
#include <Wire.h>
{{/global}}

struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    if (!isInputDirty<input_READ>(ctx))
        return;

    auto usLimit = micros() + getValue<input_TOUT>(ctx) * 1e6;
    while (!Wire.available()) {
        // TODO: we should not block here,
        // but setTimeout(ctx, 0) to try again later
        if (micros() > usLimit)
            return;
    }

    emitValue<output_BYTE>(ctx, Wire.read());
    emitValue<output_DONE>(ctx, 1);
}
