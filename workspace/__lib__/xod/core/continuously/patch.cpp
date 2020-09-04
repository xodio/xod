node {
    void evaluate(Context ctx) {
        emitValue<output_TICK>(ctx, 1);
        setTimeout(ctx, 0);
    }
}
