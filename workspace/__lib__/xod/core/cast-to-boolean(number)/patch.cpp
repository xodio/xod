
#pragma XOD dirtieness disable

node {
    void evaluate(Context ctx) {
        emitValue<output_OUT>(ctx, getValue<input_IN>(ctx) != 0.0);
    }
}
