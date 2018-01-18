
#pragma XOD dirtieness disable

struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    uint8_t x = (uint8_t)getValue<input_IN>(ctx);
    emitValue<output_OUT>(ctx, ~x);
}
