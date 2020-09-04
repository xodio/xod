#pragma XOD evaluate_on_pin disable
#pragma XOD evaluate_on_pin enable input_READ
#pragma XOD error_raise enable

node {
    void evaluate(Context ctx) {
        if (!isInputDirty<input_READ>(ctx))
            return;

        auto wire = getValue<input_I2C>(ctx);
        if (!wire->available()) {
            raiseError(ctx);
            return;
        }

        auto res = wire->read();
        if (res == -1) {
            raiseError(ctx); // Can't read byte
            return;
         }

        emitValue<output_BYTE>(ctx, (uint8_t)res);
        emitValue<output_DONE>(ctx, 1);
    }
}
