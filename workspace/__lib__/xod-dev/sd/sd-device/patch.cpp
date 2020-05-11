
{{#global}}
#include <SPI.h>
#include <SD.h>
{{/global}}

struct State {
    uint8_t mem[sizeof(SDClass)];
    SDClass* sd;
};

using Type = SDClass*;

{{ GENERATED_CODE }}

void evaluate(Context ctx) {

    auto state = getState(ctx);

    if (isSettingUp()) {
        state->sd = new (state->mem) SDClass();
    }

    auto csPin = getValue<input_CS>(ctx);

    if (!state->sd->begin(csPin)) {
        raiseError(ctx);
        return;
    }
    emitValue<output_DEV>(ctx, state->sd);
}
