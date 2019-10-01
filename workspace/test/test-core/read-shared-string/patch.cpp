
struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    if (!isInputDirty<input_IN2>(ctx)) return;

    auto sharedString = getValue<input_IN1>(ctx);

    emitValue<output_OUT>(ctx, XString(&sharedString->view));
}
