node {
    void evaluate(Context ctx) {
        auto str = getValue<input_IN>(ctx);
        emitValue<output_OUT>(ctx, length(str));
    }
}
