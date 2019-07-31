
struct State {
    bool sample = false;
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    State* state = getState(ctx);
    int8_t newValue = (int8_t) getValue<input_IN>(ctx);

    if (!isSettingUp() && newValue != state->sample)
        emitValue<output_OUT>(ctx, 1);

    state->sample = newValue;
}
