#pragma XOD evaluate_on_pin disable
#pragma XOD evaluate_on_pin enable input_SEND
#pragma XOD error_raise enable

node {
    void evaluate(Context ctx) {
        if (!isInputDirty<input_SEND>(ctx))
            return;

        auto socketIdx = getValue<input_SOCK>(ctx);
        auto inet = getValue<input_INET>(ctx);
        auto msg = getValue<input_MSG>(ctx);
        auto client = inet.sockets[socketIdx];
        if (client == nullptr) {
            raiseError(ctx);
            return;
        }

        size_t lastWriteSize;

        for (auto it = msg.iterate(); it; ++it) {
            lastWriteSize = client->write((char)*it);
            if (lastWriteSize == 0) {
                raiseError(ctx);
                return;
            }
        }

        client->flush();

        emitValue<output_DONE>(ctx, 1);
        emitValue<output_SOCKU0027>(ctx, socketIdx);
        emitValue<output_INETU0027>(ctx, inet);
    }
}
