
struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    int16_t input = getValue<input_IN>(ctx);
    uint8_t b1 = input >> 8;
    uint8_t b0 = input;
    emitValue<output_B0>(ctx, b0);
    emitValue<output_B1>(ctx, b1);
}
