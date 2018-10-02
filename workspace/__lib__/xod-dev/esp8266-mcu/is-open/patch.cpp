
struct State {
};

// clang-format off
{{ GENERATED_CODE }}
// clang-format on

void evaluate(Context ctx) {
    if (!isInputDirty<input_CHK>(ctx))
        return;

    auto client = getValue<input_SOCK>(ctx);

    if (client->connected()) {
        emitValue<output_Y>(ctx, 1);
    } else {
        emitValue<output_N>(ctx, 1);
    }
}
