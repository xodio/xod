struct State {
    bool state = false;
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    State* state = getState(ctx);
    bool newState = state->state;
    if (isInputDirty<input_TGL>(ctx)) {
        newState = !state->state;
    } else if (isInputDirty<input_SET>(ctx)) {
        newState = true;
    } else {
        newState = false;
    }

    if (newState == state->state)
        return;

    state->state = newState;
    emitValue<output_MEM>(ctx, newState);
}
