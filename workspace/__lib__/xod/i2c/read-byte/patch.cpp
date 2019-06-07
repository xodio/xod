#pragma XOD error_raise enable

struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    if (!isInputDirty<input_READ>(ctx))
        return;

    auto wire = getValue<input_I2C>(ctx);
    if (!wire->available()) {
        raiseError(ctx);
        return;
    }

    uint8_t res = (uint8_t)wire->read();
    if (res) {
        emitValue<output_BYTE>(ctx, res);
        emitValue<output_DONE>(ctx, 1);
    } else {
        raiseError(ctx); // Can't read byte
    }
}
