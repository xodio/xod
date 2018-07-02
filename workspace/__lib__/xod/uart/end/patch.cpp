struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    if (!isInputDirty<input_UPD>(ctx))
        return;

    auto uart = getValue<input_UART>(ctx);
    uart->end();
    emitValue<output_DONE>(ctx, 1);
}
