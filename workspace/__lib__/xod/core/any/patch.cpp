struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    bool p1 = isInputDirty<input_P1>(ctx);
    bool p2 = isInputDirty<input_P2>(ctx);
    if (p1 || p2)
        emitValue<output_ANY>(ctx, true);
}
