struct State {
    uint32_t n = 0;
    bool isDone = false;
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    auto state = getState(ctx);

    if (isInputDirty<input_RST>(ctx)) {
        state->isDone = false;
        state->n = 0;
    }

    if (!isInputDirty<input_PUSH>(ctx) || state->isDone)
        return;

    auto c = getValue<input_CHAR>(ctx);
    if (c >= '0' && c <= '9') {
        state->n *= 10;
        state->n += c - '0';
    } else {
        state->isDone = true;
        emitValue<output_END>(ctx, 1);
    }

    uint8_t b3 = (state->n >> 24);
    uint8_t b2 = (state->n >> 16);
    uint8_t b1 = (state->n >> 8);
    uint8_t b0 = state->n;
    emitValue<output_B0>(ctx, b0);
    emitValue<output_B1>(ctx, b1);
    emitValue<output_B2>(ctx, b2);
    emitValue<output_B3>(ctx, b3);
}
