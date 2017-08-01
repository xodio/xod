struct State {
    bool state = false;
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    State* state = getState(ctx);
    bool x = getValue<input_ST>(ctx);

    if (x != state->state) {
        state->state = x;
        TimeMs dt = getValue<input_Ts>(ctx) * 1000;
        setTimeout(ctx, dt);
    } else if (!isInputDirty<input_ST>(ctx) && !isInputDirty<input_Ts>(ctx)) {
        // TODO: implement XOD core function isTimedOut(ctx) to know for
        // sure that we’re here because of time elapsed
        emitValue<output_OUT>(ctx, x);
    }
}
