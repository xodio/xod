node {
    void evaluate(Context ctx) {
        auto inValue = getValue<input_IN>(ctx);
        emitValue<output_OUT>(ctx, isfinite(inValue));
    }
}
