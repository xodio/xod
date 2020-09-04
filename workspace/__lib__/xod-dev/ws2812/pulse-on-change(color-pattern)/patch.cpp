node {
    void evaluate(Context ctx) {
        // Storing all colors of "previous" pattern
        // to compare with the "next" one is uneffective
        // by the RAM. So it expects that the same pattern
        // will not be sent at all.

        if (isInputDirty<input_IN>(ctx))
            emitValue<output_OUT>(ctx, 1);
    }
}
