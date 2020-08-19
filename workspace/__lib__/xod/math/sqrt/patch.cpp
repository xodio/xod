
#pragma XOD dirtieness disable

node {
    void evaluate(Context ctx) {
        Number x = getValue<input_IN>(ctx);
        emitValue<output_OUT>(ctx, sqrt(x));
    }
}
