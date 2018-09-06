struct State {
};

// clang-format off
{{ GENERATED_CODE }}
// clang-format on

void evaluate(Context ctx) {
    if (!isInputDirty<input_UPD>(ctx))
        return;

    auto nfc = getValue<input_DEV>(ctx);
    uint8_t page = (uint8_t)getValue<input_PAGE>(ctx);
    uint8_t data[4] = {
        getValue<input_IN1>(ctx),
        getValue<input_IN2>(ctx),
        getValue<input_IN3>(ctx),
        getValue<input_IN4>(ctx)
    };
    uint8_t success = nfc->mifareultralight_WritePage(page, data);

    if (success) {
        emitValue<output_OK>(ctx, 1);
    } else {
        emitValue<output_ERR>(ctx, 1);
    }
}
