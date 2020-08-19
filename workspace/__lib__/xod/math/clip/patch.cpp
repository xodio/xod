
#pragma XOD dirtieness disable

node {
    void evaluate(Context ctx) {
        auto x = getValue<input_X>(ctx);
        auto rMin = getValue<input_MIN>(ctx);
        auto rMax = getValue<input_MAX>(ctx);
        auto xc =
            x > rMax ? rMax :
            x < rMin ? rMin : x;

        emitValue<output_OUT>(ctx, xc);
    }
}
