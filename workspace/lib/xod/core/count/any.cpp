
struct State {
    int32_t count = 0;
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    State* state = getState(ctx);

    if (isInputDirty<input_RST>(ctx)) {
        state->count = 0;
    } else if (isInputDirty<input_INC>(ctx)) {
        auto step = (int32_t)getValue<input_STEP>(ctx);
        state->count += step;
    }

    emitValue<output_OUT>(ctx, state->count);
}
