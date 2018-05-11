
struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    uint32_t val = getValue<input_IN>(ctx);
    uint8_t b3 = (val >> 24);
    uint8_t b2 = (val >> 16);
    uint8_t b1 = (val >> 8);
    uint8_t b0 = val;
    emitValue<output_B0>(ctx, b0);
    emitValue<output_B1>(ctx, b1);
    emitValue<output_B2>(ctx, b2);
    emitValue<output_B3>(ctx, b3);
}
