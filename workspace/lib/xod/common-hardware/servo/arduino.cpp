
{{#global}}
#include <Servo.h>
{{/global}}

struct State {
    Servo servo;
    int configuredPort = -1;
};

{{ GENERATED_CODE }}

void evaluate(NodeId nid) {
    State* state = getState(nid);
    auto port = (int)getValue<input_PORT>(nid);
    if (port != state->configuredPort) {
        state->servo.attach(port);
        state->configuredPort = port;
    }

    state->servo.write(getValue<input_VAL>(nid) * 180);
}
