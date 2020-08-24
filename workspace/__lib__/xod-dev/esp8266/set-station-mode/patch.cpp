#pragma XOD evaluate_on_pin disable
#pragma XOD evaluate_on_pin enable input_SET
#pragma XOD error_raise enable

node {
    void evaluate(Context ctx) {
        if (!isInputDirty<input_SET>(ctx))
            return;

        auto dev = getValue<input_DEV>(ctx);
        bool done = dev.wifi->setStationMode();
        if (done) {
            emitValue<output_DONE>(ctx, 1);
        } else {
            raiseError(ctx);
        }
    }
}
