node {
    void evaluate(Context ctx) {
        uint8_t num = getValue<input_IN>(ctx);
        Number result = (Number)num;
        emitValue<output_OUT>(ctx, result);
    }
}
