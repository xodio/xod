struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    TimeMs dt = getValue<input_T>(ctx) * 1000;

    if (isInputDirty<input_RST>(ctx)) {
        clearTimeout(ctx);
    } else if (isInputDirty<input_SET>(ctx)) {
        setTimeout(ctx, dt);
    } else {
        // It was a scheduled evaluation
        emitValue<output_DONE>(ctx, true);
    }
}
