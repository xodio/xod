
struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    uint8_t b1 = getValue<input_B1>(ctx);
    uint8_t b0 = getValue<input_B0>(ctx);
    int16_t bytes = ((b1 << 8) | b0);
    Number result = (Number)bytes;
    emitValue<output_OUT>(ctx, result);
}
