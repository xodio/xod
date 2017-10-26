struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    if (getValue<input_EN>(ctx) && isInputDirty<input_IN>(ctx))
        emitValue<output_OUT>(ctx, true);
}
