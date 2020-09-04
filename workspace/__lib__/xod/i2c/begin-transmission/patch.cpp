#pragma XOD evaluate_on_pin disable
#pragma XOD evaluate_on_pin enable input_SEND
#pragma XOD error_raise enable

node {
    void evaluate(Context ctx) {
        if (!isInputDirty<input_SEND>(ctx))
            return;

        uint8_t addr = getValue<input_ADDR>(ctx);

        if (addr > 127) {
            raiseError(ctx); // Invalid I2C address
            return;
        }

        auto wire = getValue<input_I2C>(ctx);
        wire->beginTransmission(addr);
        emitValue<output_DONE>(ctx, 1);
    }
}
