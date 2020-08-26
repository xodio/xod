#pragma XOD evaluate_on_pin disable
#pragma XOD evaluate_on_pin enable input_PAIR

node {
    void evaluate(Context ctx) {
        if (!isInputDirty<input_PAIR>(ctx))
            return;

        auto nfc = getValue<input_DEV>(ctx);

        uint8_t uidLength;
        uint8_t readedUid[12];
        bool res = nfc->readPassiveTargetID(PN532_MIFARE_ISO14443A, readedUid, &uidLength);

        if (res) {
            typeof_UID uid;
            memset(readedUid + uidLength, 0, 12 - uidLength);
            memcpy(uid.items, readedUid, 7);
            emitValue<output_UID>(ctx, uid);
            emitValue<output_OK>(ctx, 1);
        } else {
            emitValue<output_UID>(ctx, remove_pointer<typeof_UID>::type::empty());
            emitValue<output_NA>(ctx, 1);
        }
    }
}
