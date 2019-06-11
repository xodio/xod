
struct State {
    Number sample = NAN;
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    State* state = getState(ctx);
    auto newValue = getValue<input_IN>(ctx);

    if (newValue != state->sample)
        emitValue<output_OUT>(ctx, 1);

    state->sample = newValue;
}
