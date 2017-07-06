
{{#global}}
#include <Servo.h>
{{/global}}

struct State {
    Servo servo;
    int configuredPort = -1;
};

{{ GENERATED_CODE }}

void evaluate(NodeId nid, State* state) {
    auto port = (int)getValue<Inputs::PORT>(nid);
    if (port != state->configuredPort) {
        state->servo.attach(port);
        state->configuredPort = port;
    }

    state->servo.write(getValue<Inputs::VAL>(nid) * 180);
}
