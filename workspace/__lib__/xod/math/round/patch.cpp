
#pragma XOD dirtieness disable

node {
    void evaluate(Context ctx) {
        auto x = getValue<input_IN>(ctx);
        emitValue<output_OUT>(ctx, round(x));
    }
}
