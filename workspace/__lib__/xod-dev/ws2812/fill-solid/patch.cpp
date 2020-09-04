node {
    void evaluate(Context ctx) {
        auto dev = getValue<input_DEV>(ctx);
        if (isInputDirty<input_DO>(ctx)) {
            auto color = getValue<input_C>(ctx);
            auto num = getValue<input_NUM>(ctx);
            if (isinf(num)) {
                // Fill all the LEDs
                dev->fill(color);
            } else {
                // Fill only specified number of LEDs
                bool fromTail = num < 0;
                uint32_t pixelsCount = (uint32_t) abs(num);
                dev->fill(color, pixelsCount, fromTail);
            }

            emitValue<output_DONE>(ctx, 1);
        }
        emitValue<output_DEVU0027>(ctx, dev);
    }
}
