
#pragma XOD dirtieness disable

node {
    void evaluate(Context ctx) {
        Number base = getValue<input_BASE>(ctx);
        Number exponent = getValue<input_EXP>(ctx);
        emitValue<output_OUT>(ctx, pow(base, exponent));
    }
}
