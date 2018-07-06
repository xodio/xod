
struct State {
};

// clang-format off
{{ GENERATED_CODE }}
// clang-format on

void evaluate(Context ctx) {
    if (!isInputDirty<input_CHK>(ctx))
        return;

    auto inet = getValue<input_INET>(ctx);
    if (inet.wifi->isSocketOpen()) {
        emitValue<output_Y>(ctx, 1);
    } else {
        emitValue<output_N>(ctx, 1);
    }
}
