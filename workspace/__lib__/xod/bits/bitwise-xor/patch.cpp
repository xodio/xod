#pragma XOD dirtieness disable

node {
    void evaluate(Context ctx) {
        auto in1 = getValue<input_IN1>(ctx);
        auto in2 = getValue<input_IN2>(ctx);
        emitValue<output_OUT>(ctx, in1 ^ in2);
    }
}
