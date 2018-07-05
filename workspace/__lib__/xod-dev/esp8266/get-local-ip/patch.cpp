
struct State {
};

// clang-format off
{{ GENERATED_CODE }}
// clang-format on

void evaluate(Context ctx) {
    if (!isInputDirty<input_UPD>(ctx))
        return;

    auto esp = getValue<input_DEV>(ctx);
    ValueType<output_IP>::T ip = esp.wifi->getIP();
    emitValue<output_IP>(ctx, ip);
    emitValue<output_DONE>(ctx, 1);
}
