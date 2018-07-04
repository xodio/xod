
struct State {
    uint8_t mac[6];
};

using Type = uint8_t*;

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    auto state = getState(ctx);

    state->mac[0] = getValue<input_IN1>(ctx);
    state->mac[1] = getValue<input_IN2>(ctx);
    state->mac[2] = getValue<input_IN3>(ctx);
    state->mac[3] = getValue<input_IN4>(ctx);
    state->mac[4] = getValue<input_IN5>(ctx);
    state->mac[5] = getValue<input_IN6>(ctx);

    emitValue<output_OUT>(ctx, state->mac);
}
