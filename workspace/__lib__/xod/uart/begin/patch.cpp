struct State {
};

// clang-format off
{{ GENERATED_CODE }}
// clang-format on

void evaluate(Context ctx) {
    if (!isInputDirty<input_UPD>(ctx))
        return;
    auto uart = getValue<input_UART>(ctx);
    uart->begin();
    emitValue<output_DONE>(ctx, 1);
}
