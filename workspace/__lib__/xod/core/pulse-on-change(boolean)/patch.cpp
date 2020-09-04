
node {
    bool sample = false;

    void evaluate(Context ctx) {
        int8_t newValue = (int8_t) getValue<input_IN>(ctx);

        if (!isSettingUp() && newValue != sample)
            emitValue<output_OUT>(ctx, 1);

        sample = newValue;
    }
}
