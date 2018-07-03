
struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    if (!isInputDirty<input_KICK>(ctx))
        return;

    auto dev = getValue<input_DEV>(ctx);
    bool res = dev.wifi->kick();
    if (res) {
        emitValue<output_OK>(ctx, 1);
    } else {
        emitValue<output_ERR>(ctx, 1);
    }
}
