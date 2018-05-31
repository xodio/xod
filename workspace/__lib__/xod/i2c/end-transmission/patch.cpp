struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    if (!isInputDirty<input_SEND>(ctx))
        return;

    auto wire = getValue<input_I2C>(ctx);
    auto res = wire->endTransmission();
    if (res != 0) {
      emitValue<output_ERR>(ctx, 1);
      return;
    }

    emitValue<output_DONE>(ctx, 1);
}
