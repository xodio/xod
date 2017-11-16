struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    if (isInputDirty<input_RST>(ctx)) {
        clearTimeout(ctx);
        emitValue<output_ACT>(ctx, false);
    } else if (isInputDirty<input_SET>(ctx)) {
        TimeMs dt = getValue<input_T>(ctx) * 1000;
        setTimeout(ctx, dt);
        emitValue<output_ACT>(ctx, true);
    } else if (isTimedOut(ctx)) {
        emitValue<output_DONE>(ctx, true);
        emitValue<output_ACT>(ctx, false);
    }
}
