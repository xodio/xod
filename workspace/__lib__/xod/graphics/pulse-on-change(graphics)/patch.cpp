node {
    void evaluate(Context ctx) {
        //Change in at least one of the elements in the graphical tree is a signal that the whole tree has changed.

        if (isInputDirty<input_IN>(ctx))
            emitValue<output_OUT>(ctx, 1);
    }
}
