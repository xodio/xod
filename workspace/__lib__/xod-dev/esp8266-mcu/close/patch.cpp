#pragma XOD evaluate_on_pin disable
#pragma XOD evaluate_on_pin enable input_CLS

node {
    void evaluate(Context ctx) {
        if (!isInputDirty<input_CLS>(ctx))
            return;

        auto socketIdx = getValue<input_SOCK>(ctx);
        auto inet = getValue<input_INET>(ctx);
        auto client = inet.sockets[socketIdx];

        client->stop();
        emitValue<output_DONE>(ctx, 1);
        emitValue<output_INETU0027>(ctx, inet);
    }
}
