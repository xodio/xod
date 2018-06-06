struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    if (!isInputDirty<input_READ>(ctx))
        return;

    auto wire = getValue<input_I2C>(ctx);
    if (!wire->available()) {
        emitValue<output_BYTE>(ctx, 0x00);
        emitValue<output_ERR>(ctx, 1);
        return;
    }

    emitValue<output_BYTE>(ctx, (uint8_t)wire->read());
    emitValue<output_DONE>(ctx, 1);
}
