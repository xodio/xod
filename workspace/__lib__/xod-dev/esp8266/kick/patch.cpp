#pragma XOD evaluate_on_pin disable
#pragma XOD evaluate_on_pin enable input_KICK
#pragma XOD error_raise enable

node {
    void evaluate(Context ctx) {
        if (!isInputDirty<input_KICK>(ctx))
            return;

        auto dev = getValue<input_DEV>(ctx);
        bool res = dev.wifi->kick();
        if (res) {
            emitValue<output_OK>(ctx, 1);
        } else {
            raiseError(ctx);
        }
    }
}
