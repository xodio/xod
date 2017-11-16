
struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    Number count = getValue<output_OUT>(ctx);

    if (isInputDirty<input_RST>(ctx))
        count = 0;
    else if (isInputDirty<input_INC>(ctx))
        count += getValue<input_STEP>(ctx);

    emitValue<output_OUT>(ctx, count);
}
