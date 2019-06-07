#pragma XOD error_raise enable

struct State {
};

// clang-format off
{{ GENERATED_CODE }}
// clang-format on

void evaluate(Context ctx) {
    if (!isInputDirty<input_INIT>(ctx))
        return;

    auto nfc = getValue<input_DEV>(ctx);

    nfc->begin();

    uint32_t versiondata = nfc->getFirmwareVersion();
    if (!versiondata) {
      raiseError(ctx, 244);
      return;
    }

    nfc->setPassiveActivationRetries(0x01);
    nfc->SAMConfig();

    emitValue<output_OK>(ctx, 1);
}
