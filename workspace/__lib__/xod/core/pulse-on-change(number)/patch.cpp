
node {
    Number sample = NAN;

    void evaluate(Context ctx) {
        auto newValue = getValue<input_IN>(ctx);

        if (!isSettingUp() && newValue != sample)
            emitValue<output_OUT>(ctx, 1);

        sample = newValue;
    }
}
