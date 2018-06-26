
struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    if (!getValue<input_COND>(ctx))
        return;

    if (!isInputDirty<input_IN2>(ctx))
        return;

    emitValue<output_OUT1>(ctx, getValue<input_IN1>(ctx));
    emitValue<output_OUT2>(ctx, 1);
}
