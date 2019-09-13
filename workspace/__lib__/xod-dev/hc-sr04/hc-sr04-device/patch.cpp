
struct State {
    uint8_t echoPort = 0;
    uint8_t trigPort = 0;
};

using Type = State*;

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    auto state = getState(ctx);
    uint8_t trigPort = getValue<input_TRIG>(ctx);
    uint8_t echoPort = getValue<input_ECHO>(ctx);

    state->trigPort = trigPort;
    state->echoPort = echoPort;

    pinMode(trigPort, OUTPUT);
    pinMode(echoPort, INPUT);

    emitValue<output_OUT>(ctx, state);
}
