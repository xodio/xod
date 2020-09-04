#pragma XOD evaluate_on_pin disable
#pragma XOD evaluate_on_pin enable input_CONN

node {
    void evaluate(Context ctx) {
        if (!isInputDirty<input_CONN>(ctx))
            return;

        auto inet = getValue<input_INET>(ctx);

        // Do nothing if TCP connection is already opened
        if (inet->isConnected()) return;

        auto host = getValue<input_HOST>(ctx);
        uint32_t port = (uint32_t)getValue<input_PORT>(ctx);

        emitValue<output_INETU0027>(ctx, inet);
        if (inet->openTcp(host, port)) {
            emitValue<output_SOCK>(ctx, 0); // TODO: MUX
            emitValue<output_DONE>(ctx, 1);
        } else {
            raiseError(ctx);
        }
    }
}
