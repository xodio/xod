struct State {
};

// clang-format off
{{ GENERATED_CODE }}
// clang-format on

void evaluate(Context ctx) {
    if (!isInputDirty<input_PAIR>(ctx))
        return;

    auto nfc = getValue<input_DEV>(ctx);

    uint8_t uidLength;
    uint8_t readedUid[12];
    bool res = nfc->readPassiveTargetID(PN532_MIFARE_ISO14443A, readedUid, &uidLength);

    if (res) {
        ValueType<output_UID>::T uid;
        memset(readedUid + uidLength, 0, 12 - uidLength);
        memcpy(uid.items, readedUid, 7);
        emitValue<output_UID>(ctx, uid);
        emitValue<output_OK>(ctx, 1);
    } else {
        emitValue<output_UID>(ctx, ValueType<output_UID>::T::empty());
        emitValue<output_NA>(ctx, 1);
    }
}
