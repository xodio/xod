#pragma XOD evaluate_on_pin disable
#pragma XOD evaluate_on_pin enable input_UPD

{{#global}}
#include <Servo.h>
{{/global}}

struct State {
    Servo servo;
    int configuredPort = -1;
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    static_assert(isValidDigitalPort(constant_input_PORT), "must be a valid digital port");

    if (!isInputDirty<input_UPD>(ctx))
        return;

    State* state = getState(ctx);
    // TODO
    auto port = (int)getValue<input_PORT>(ctx);

    if (port != state->configuredPort) {
        state->servo.attach(port);
        state->configuredPort = port;
    }

    state->servo.write(getValue<input_VAL>(ctx) * 180);
    emitValue<output_DONE>(ctx, 1);
}
