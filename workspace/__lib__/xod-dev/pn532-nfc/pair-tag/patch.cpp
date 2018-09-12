struct State {
};

// clang-format off
{{ GENERATED_CODE }}
// clang-format on

void evaluate(Context ctx) {
    if (!isInputDirty<input_PAIR>(ctx))
        return;

    auto nfc = getValue<input_DEV>(ctx);

    ValueType<output_UID>::T uid;
    uint8_t uidLength;

    uint8_t readedUid[12];
    bool res = nfc->readPassiveTargetID(PN532_MIFARE_ISO14443A, readedUid, &uidLength);
    memset(readedUid + uidLength, 0, 12 - uidLength);
    memcpy(uid.items, readedUid, 7);

    if (res) {
        emitValue<output_UID>(ctx, uid);
        emitValue<output_OK>(ctx, 1);
    } else {
        emitValue<output_ERR>(ctx, 1);
    }
}
