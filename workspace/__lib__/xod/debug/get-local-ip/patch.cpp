#pragma XOD evaluate_on_pin disable
#pragma XOD evaluate_on_pin enable input_UPD

node {
    void evaluate(Context ctx) {
        if (!isInputDirty<input_UPD>(ctx))
            return;

        auto inet = getValue<input_INET>(ctx);
        typeof_IP ip = inet->getIP();
        if (ip == 0) {
            raiseError(ctx);
            return;
        }
        emitValue<output_IP>(ctx, ip);
        emitValue<output_DONE>(ctx, 1);
    }
}
