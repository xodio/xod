
struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    auto dev = getValue<input_DEV>(ctx);
    if (isInputDirty<input_DO>(ctx)) {
        auto color = getValue<input_C>(ctx);

        dev->fill(color.r, color.g, color.b);

        emitValue<output_DONE>(ctx, 1);
    }
    emitValue<output_DEVU0027>(ctx, dev);
}
