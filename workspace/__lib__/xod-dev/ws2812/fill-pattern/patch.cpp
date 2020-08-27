node {
    void evaluate(Context ctx) {
        auto dev = getValue<input_DEV>(ctx);

        if (isInputDirty<input_DO>(ctx)) {
            auto pat = getValue<input_PAT>(ctx);
            uint32_t shift = (uint32_t)getValue<input_SHFT>(ctx);
            dev->fillPattern(pat, shift);
        }

        emitValue<output_DEVU0027>(ctx, dev);
    }
}
