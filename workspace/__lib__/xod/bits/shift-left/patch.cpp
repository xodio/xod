
struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    uint8_t x = (uint8_t)getValue<input_BYTE>(ctx);
    uint8_t n = (uint8_t)getValue<input_N>(ctx);
    emitValue<output_OUT>(ctx, x << n);
}
