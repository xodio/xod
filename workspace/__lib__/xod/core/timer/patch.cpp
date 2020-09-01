node {
    TimeMs lastUpdateTime;

    void evaluate(Context ctx) {
        bool enabled = getValue<input_EN>(ctx);
        bool update = isInputDirty<input_UPD>(ctx);
        bool reset = isInputDirty<input_RST>(ctx);

        TimeMs t = transactionTime();
        if (reset)
            emitValue<output_OUT>(ctx, 0);
        else if (enabled && update) {
            Number dtSeconds = (t - lastUpdateTime) / 1000.0;
            Number oldSeconds = getValue<output_OUT>(ctx);
            emitValue<output_OUT>(ctx, oldSeconds + dtSeconds);
        }

        lastUpdateTime = t;
    }
}
