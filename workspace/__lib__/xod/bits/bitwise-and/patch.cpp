
struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    uint8_t in1 = (uint8_t)getValue<input_IN1>(ctx);
    uint8_t in2 = (uint8_t)getValue<input_IN2>(ctx);
    emitValue<output_OUT>(ctx, in1 & in2);
}
