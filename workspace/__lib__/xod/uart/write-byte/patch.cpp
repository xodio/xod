#pragma XOD evaluate_on_pin disable
#pragma XOD evaluate_on_pin enable input_SEND
#pragma XOD error_raise enable

node {
    void evaluate(Context ctx) {
        if (!isInputDirty<input_SEND>(ctx))
            return;

        auto uart = getValue<input_UART>(ctx);
        uint8_t byte = getValue<input_BYTE>(ctx);
        bool res = uart->writeByte(byte);
        if (res) {
            emitValue<output_DONE>(ctx, 1);
        } else {
            raiseError(ctx); // No bytes written
        }
    }
}
