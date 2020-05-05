
node {
    void evaluate(Context ctx) {
        auto t = getValue<input_DEV>(ctx);
        if (isInputDirty<input_DO>(ctx)) {
            t.lcd->setBacklight(getValue<input_BL>(ctx));
            emitValue<output_DONE>(ctx, 1);
        }

        emitValue<output_DEVU0027>(ctx, t);
    }
}
