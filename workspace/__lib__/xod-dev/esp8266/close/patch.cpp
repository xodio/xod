
struct State {
};

// clang-format off
{{ GENERATED_CODE }}
// clang-format on

void evaluate(Context ctx) {
    if (!isInputDirty<input_CLS>(ctx))
        return;

    auto inet = getValue<input_INET>(ctx);
    inet.wifi->releaseTCP();
    emitValue<output_DONE>(ctx, 1);
}
