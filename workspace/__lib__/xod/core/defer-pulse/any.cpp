struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    if (isInputDirty<input_IN>(ctx)) { // This happens only when all nodes are evaluated
        setTimeout(ctx, 0);
    } else {
        emitValue<output_OUT>(ctx, true);
    }
}
