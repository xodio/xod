#pragma XOD error_raise enable

struct State {
};

// clang-format off
{{ GENERATED_CODE }}
// clang-format on

void evaluate(Context ctx) {
    if (!isInputDirty<input_SET>(ctx))
        return;

    auto dev = getValue<input_DEV>(ctx);
    bool done = dev.wifi->setStationMode();
    if (done) {
        emitValue<output_DONE>(ctx, 1);
    } else {
        raiseError(ctx, 245);
    }
}
