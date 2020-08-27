node {
    void evaluate(Context ctx) {
        auto dev = getValue<input_DEV>(ctx);
        if (isInputDirty<input_DO>(ctx)) {
            dev->fill(0, 0, 0);
            emitValue<output_DONE>(ctx, 1);
        }
        emitValue<output_DEVU0027>(ctx, dev);
    }
}
