#pragma XOD evaluate_on_pin disable
#pragma XOD evaluate_on_pin enable input_KICK

node {
    void evaluate(Context ctx) {
        if (!isInputDirty<input_KICK>(ctx))
            return;

        auto inet = getValue<input_INET>(ctx);
        if (inet->kick()) {
            emitValue<output_OK>(ctx, 1);
        } else {
            raiseError(ctx);
        }
    }
}
