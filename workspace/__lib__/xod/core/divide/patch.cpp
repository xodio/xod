
#pragma XOD dirtieness disable

node {
    void evaluate(Context ctx) {
        auto x = getValue<input_IN1>(ctx);
        auto y = getValue<input_IN2>(ctx);
        emitValue<output_OUT>(ctx, x / y);
    }
}
