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
    }

    if (isTimedOut(ctx)) {
        emitValue<output_OUT>(ctx, x);
    }
}
