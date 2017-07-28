
{{#global}}
#include <Servo.h>
{{/global}}

struct State {
    Servo servo;
    int configuredPort = -1;
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    State* state = getState(ctx);
    auto port = (int)getValue<input_PORT>(ctx);
    if (port != state->configuredPort) {
        state->servo.attach(port);
        state->configuredPort = port;
    }

    state->servo.write(getValue<input_VAL>(ctx) * 180);
}
