
struct State {
    bool hasStarted : 1;
    bool shouldEmitOnEnd : 1;

    State() {
        hasStarted = false;
        shouldEmitOnEnd = false;
    }
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    if (isSettingUp()) return;

    auto state = getState(ctx);
    auto inValue = getValue<input_IN>(ctx);

    if (isInputDirty<input_IN>(ctx)) {
        if (!state->hasStarted) {
            state->hasStarted = true;
            emitValue<output_OUT>(ctx, inValue);
            TimeMs dt = getValue<input_T>(ctx) * 1000;
            setTimeout(ctx, dt);
        } else {
            state->shouldEmitOnEnd = true;
        }
    }

    if (isTimedOut(ctx)) {
        state->hasStarted = false;
    }
    if (isTimedOut(ctx) && state->shouldEmitOnEnd) {
        state->shouldEmitOnEnd = false;
        emitValue<output_OUT>(ctx, inValue);
    }
}
