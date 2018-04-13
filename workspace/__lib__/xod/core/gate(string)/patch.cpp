struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    if (getValue<input_EN>(ctx))
        emitValue<output_OUT>(ctx, getValue<input_IN>(ctx));
}
