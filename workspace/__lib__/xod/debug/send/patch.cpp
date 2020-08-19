#pragma XOD evaluate_on_pin disable
#pragma XOD evaluate_on_pin enable input_SEND

node {
    void evaluate(Context ctx) {
        if (!isInputDirty<input_SEND>(ctx))
            return;

        auto socket = getValue<input_SOCK>(ctx);
        auto req = getValue<input_MSG>(ctx);
        auto inet = getValue<input_INET>(ctx);

        emitValue<output_INETU0027>(ctx, inet);
        emitValue<output_SOCKU0027>(ctx, socket);
        if (inet->send(req)) {
            emitValue<output_DONE>(ctx, 1);
        } else {
            raiseError(ctx);
        }
    }
}
