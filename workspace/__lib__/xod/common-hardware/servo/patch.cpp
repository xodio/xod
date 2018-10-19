
{{#global}}
#include <Servo.h>
{{/global}}

struct State {
    Servo servo;
    int configuredPort = -1;
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    if (!isInputDirty<input_UPD>(ctx))
        return;

    State* state = getState(ctx);
    auto port = (int)getValue<input_PORT>(ctx);
    if (!isValidDigitalPort(port)) {
        emitValue<output_ERR>(ctx, 1);
        return;
    }

    if (port != state->configuredPort) {
        state->servo.attach(port);
        state->configuredPort = port;
    }

    state->servo.write(getValue<input_VAL>(ctx) * 180);
    emitValue<output_DONE>(ctx, 1);
}
