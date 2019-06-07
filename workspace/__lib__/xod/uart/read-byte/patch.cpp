#pragma XOD error_raise enable

struct State {
};

// clang-format off
{{ GENERATED_CODE }}
// clang-format on

void evaluate(Context ctx) {
    if (!isInputDirty<input_READ>(ctx))
        return;

    auto uart = getValue<input_UART>(ctx);
    if (!uart->available()) {
        emitValue<output_NA>(ctx, 1);
        return;
    }

    uint8_t byte = 0x00;
    if (uart->readByte(&byte)) {
        emitValue<output_DONE>(ctx, 1);
        emitValue<output_BYTE>(ctx, byte);
    } else {
        raiseError(ctx, 236); // Can't read byte
    }
}
