#pragma XOD evaluate_on_pin disable
#pragma XOD evaluate_on_pin enable input_UPD
#pragma XOD error_raise enable

node {
    void evaluate(Context ctx) {
        if (!isInputDirty<input_UPD>(ctx))
            return;

        auto esp = getValue<input_DEV>(ctx);
        typeof_IP ip = esp.wifi->getIP();
        if (ip == 0) {
            raiseError(ctx);
            return;
        }
        emitValue<output_IP>(ctx, ip);
        emitValue<output_DONE>(ctx, 1);
    }
}
