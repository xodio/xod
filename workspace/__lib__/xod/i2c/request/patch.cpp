#pragma XOD error_raise enable

struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    if (!isInputDirty<input_SEND>(ctx))
        return;

    auto wire = getValue<input_I2C>(ctx);
    auto addr = (uint8_t)getValue<input_ADDR>(ctx);
    auto nBytes = (uint8_t)getValue<input_N>(ctx);

    if (addr > 127) {
        raiseError(ctx); // Invalid I2C address
        return;
    }

    wire->requestFrom(addr, nBytes);
    emitValue<output_DONE>(ctx, 1);
}
