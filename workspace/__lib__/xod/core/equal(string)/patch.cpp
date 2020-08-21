#pragma XOD dirtieness disable

node {
    void evaluate(Context ctx) {
        auto lhs = getValue<input_IN1>(ctx);
        auto rhs = getValue<input_IN2>(ctx);

        emitValue<output_OUT>(ctx, equal(lhs, rhs));
    }
}
