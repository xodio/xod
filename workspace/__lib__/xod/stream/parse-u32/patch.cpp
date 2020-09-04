node {
    uint32_t n = 0;
    bool isDone = false;

    void evaluate(Context ctx) {
        if (isInputDirty<input_RST>(ctx)) {
            isDone = false;
            n = 0;
        }

        if (!isInputDirty<input_PUSH>(ctx) || isDone)
            return;

        auto c = getValue<input_CHAR>(ctx);
        if (c >= '0' && c <= '9') {
            n *= 10;
            n += c - '0';
        } else {
            isDone = true;
            emitValue<output_END>(ctx, 1);
        }

        uint8_t b3 = (n >> 24);
        uint8_t b2 = (n >> 16);
        uint8_t b1 = (n >> 8);
        uint8_t b0 = n;
        emitValue<output_B0>(ctx, b0);
        emitValue<output_B1>(ctx, b1);
        emitValue<output_B2>(ctx, b2);
        emitValue<output_B3>(ctx, b3);
    }
}
