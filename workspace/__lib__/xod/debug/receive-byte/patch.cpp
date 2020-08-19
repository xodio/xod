#pragma XOD evaluate_on_pin disable
#pragma XOD evaluate_on_pin enable input_READ

node {
    void evaluate(Context ctx) {
        if (!isInputDirty<input_READ>(ctx))
            return;

        auto inet = getValue<input_INET>(ctx);
        char r;
        emitValue<output_INETU0027>(ctx, inet);
        if (inet->receiveByte(&r)) {
            emitValue<output_CHAR>(ctx, (uint8_t)r);
            emitValue<output_DONE>(ctx, 1);
        }
    }
}
