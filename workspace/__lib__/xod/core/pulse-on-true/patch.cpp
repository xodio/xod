
node {
    bool state = false;

    void evaluate(Context ctx) {
        auto newValue = getValue<input_IN>(ctx);

        if (!isSettingUp() && newValue == true && state == false)
            emitValue<output_OUT>(ctx, 1);

        state = newValue;
    }
}
