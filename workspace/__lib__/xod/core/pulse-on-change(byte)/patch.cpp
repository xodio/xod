
struct State {
    uint8_t sample = 0;
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    State* state = getState(ctx);
    auto newValue = getValue<input_IN>(ctx);

    if (!isSettingUp() && newValue != state->sample)
        emitValue<output_OUT>(ctx, 1);

    state->sample = newValue;
}
