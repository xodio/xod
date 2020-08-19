
#pragma XOD dirtieness disable

node {
    void evaluate(Context ctx) {
        Number x = getValue<input_RAD>(ctx);
        emitValue<output_OUT>(ctx, sin(x));
    }
}
