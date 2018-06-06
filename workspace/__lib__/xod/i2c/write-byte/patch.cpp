struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    if (!isInputDirty<input_SEND>(ctx))
        return;

    auto wire = getValue<input_I2C>(ctx);
    auto written = wire->write(getValue<input_BYTE>(ctx));
    if (written != 1) {
      emitValue<output_ERR>(ctx, 1);
      return;
    }

    emitValue<output_DONE>(ctx, 1);
}
