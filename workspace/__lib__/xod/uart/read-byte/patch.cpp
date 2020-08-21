#pragma XOD evaluate_on_pin disable
#pragma XOD evaluate_on_pin enable input_READ
#pragma XOD error_raise enable

node {
    void evaluate(Context ctx) {
        if (!isInputDirty<input_READ>(ctx))
            return;

        auto uart = getValue<input_UART>(ctx);
        if (!uart->available()) {
            raiseError(ctx);
            return;
        }

        uint8_t byte = 0x00;
        if (uart->readByte(&byte)) {
            emitValue<output_DONE>(ctx, 1);
            emitValue<output_BYTE>(ctx, byte);
        } else {
            raiseError(ctx); // Can't read byte
        }
    }
}
