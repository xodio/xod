node {
    void evaluate(Context ctx) {
        auto dev = getValue<input_DEV>(ctx);

        if (isSettingUp())
            emitValue<output_DEVU0027>(ctx, dev);

        if (!isInputDirty<input_DO>(ctx))
            return;

        uint8_t rotation = getValue<input_R>(ctx);
        dev->setRotation(rotation);

        emitValue<output_DONE>(ctx, 1);
    }
}
