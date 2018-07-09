struct State {
};

// clang-format off
{{ GENERATED_CODE }}
// clang-format on

void evaluate(Context ctx) {
    if (!isInputDirty<input_SEND>(ctx))
        return;

    auto uart = getValue<input_UART>(ctx);
    uint8_t byte = getValue<input_BYTE>(ctx);
    bool res = uart->writeByte(byte);
    if (res) {
        emitValue<output_DONE>(ctx, 1);
    } else {
        emitValue<output_ERR>(ctx, 1);
    }
}
