
node {
    meta {
        using Type = uint32_t;
    }
    void evaluate(Context ctx) {
        if (isInputDirty<input_UPD>(ctx)) {
            emitValue<output_OUT>(ctx, micros());
        }
    }
}
