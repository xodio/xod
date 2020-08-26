node {
    void evaluate(Context ctx) {
        if (!isSettingUp())
            return;
        auto dev = getValue<input_DEV>(ctx);
        dev->initTypeG();
        emitValue<output_DEVU0027>(ctx, dev);
    }
}
