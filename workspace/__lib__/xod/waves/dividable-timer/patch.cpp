
node {
    TimeMs lastUpdateTime;

    void evaluate(Context ctx) {
        TimeMs t = transactionTime();
        Number divider = getValue<input_DIV>(ctx);

        if (divider <= 0 || isInputDirty<input_RST>(ctx)) {
            emitValue<output_OUT>(ctx, 0);
        }
        else if (getValue<input_EN>(ctx) && isInputDirty<input_UPD>(ctx)) {
            Number currentOutput = getValue<output_OUT>(ctx);
            Number dtSeconds = (t - lastUpdateTime) / 1000.0;
            emitValue<output_OUT>(ctx, currentOutput + (dtSeconds / divider));
        }

        lastUpdateTime = t;
    }
}
