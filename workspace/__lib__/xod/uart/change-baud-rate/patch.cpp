
struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    if (!isInputDirty<input_UPD>(ctx))
        return;

    auto uart = getValue<input_UART>(ctx);
    long baud = (long) getValue<input_BAUD>(ctx);
    uart->changeBaudRate(baud);
    emitValue<output_DONE>(ctx, 1);
}
