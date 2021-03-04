
node {
    void evaluate(Context ctx) {
        emitValue<output_OUT>(ctx, getValue<input_IN1>(ctx) + 1);
    }
}
