
struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    auto dev = getValue<input_DEV>(ctx);
    if (isInputDirty<input_DO>(ctx)) {
        auto color = getValue<input_C>(ctx);
        auto num = getValue<input_NUM>(ctx);
        if (num == -1) {
            // Fill all the LEDs
            dev->fill(color);
        } else {
            // Fill only specified number of LEDs
            dev->fill(color, (uint32_t)num);
        }

        emitValue<output_DONE>(ctx, 1);
    }
    emitValue<output_DEVU0027>(ctx, dev);
}
