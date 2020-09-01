node {
    void evaluate(Context ctx) {
        auto color = getValue<input_IN>(ctx);
        emitValue<output_R>(ctx, color.r);
        emitValue<output_G>(ctx, color.g);
        emitValue<output_B>(ctx, color.b);
    }
}
