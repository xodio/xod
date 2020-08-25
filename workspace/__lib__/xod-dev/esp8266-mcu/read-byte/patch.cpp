#pragma XOD evaluate_on_pin disable
#pragma XOD evaluate_on_pin enable input_READ

node {
    void evaluate(Context ctx) {
        if (!isInputDirty<input_READ>(ctx))
            return;

        auto socketIdx = getValue<input_SOCK>(ctx);
        auto inet = getValue<input_INET>(ctx);
        auto client = inet.sockets[socketIdx];

        int b = client->read();
        if (b < 0) {
            emitValue<output_NA>(ctx, 1);
            return;
        }

        emitValue<output_B>(ctx, (uint8_t)b);
        emitValue<output_DONE>(ctx, 1);
    }
}
