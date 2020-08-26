node {
    void evaluate(Context ctx) {
        auto dev = getValue<input_DEV>(ctx);

        if (isSettingUp())
            emitValue<output_DEVU0027>(ctx, dev);

        if (!isInputDirty<input_DO>(ctx))
            return;

        auto gfx = getValue<input_GFX>(ctx);

        if (gfx) {
            gfx->render(dev);
            dev->sendBuffer();
        }

        emitValue<output_DONE>(ctx, 1);
    }
}
