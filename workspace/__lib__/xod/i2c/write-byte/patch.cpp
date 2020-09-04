#pragma XOD evaluate_on_pin disable
#pragma XOD evaluate_on_pin enable input_SEND
#pragma XOD error_raise enable

node {
    void evaluate(Context ctx) {
        if (!isInputDirty<input_SEND>(ctx))
            return;

        auto wire = getValue<input_I2C>(ctx);
        auto written = wire->write(getValue<input_BYTE>(ctx));
        if (written != 1) {
          raiseError(ctx); // No bytes written
          return;
        }

        emitValue<output_DONE>(ctx, 1);
    }
}
