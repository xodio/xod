
node {
    typeof_IN lastMicros = 0;

    void evaluate(Context ctx) {
        if (!isInputDirty<input_UPD>(ctx)) return;

        typeof_IN newLast = getValue<input_IN>(ctx);
        emitValue<output_OUT>(ctx, newLast - lastMicros);
        lastMicros = newLast;
    }
}
