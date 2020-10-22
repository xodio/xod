node {
    void evaluate(Context ctx) {
        if (getValue<input_EN>(ctx)) {
            emitValue<output_TICK>(ctx, 1);
            setImmediate();
        }
    }
}
