struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    if (!isInputDirty<input_UPD>(ctx))
        return;

    emitValue<output_MEM>(ctx, getValue<input_NEW>(ctx));
}
