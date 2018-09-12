struct State {
};

// clang-format off
{{ GENERATED_CODE }}
// clang-format on

void evaluate(Context ctx) {
    if (!isInputDirty<input_READ>(ctx))
        return;

    auto nfc = getValue<input_DEV>(ctx);
    uint8_t page = (uint8_t)getValue<input_PAGE>(ctx);

    uint8_t data[4];
    uint8_t success = nfc->mifareultralight_ReadPage(page, data);

    if (success) {
        emitValue<output_OUT1>(ctx, data[0]);
        emitValue<output_OUT2>(ctx, data[1]);
        emitValue<output_OUT3>(ctx, data[2]);
        emitValue<output_OUT4>(ctx, data[3]);
        emitValue<output_OK>(ctx, 1);
    } else {
        emitValue<output_ERR>(ctx, 1);
    }
}
