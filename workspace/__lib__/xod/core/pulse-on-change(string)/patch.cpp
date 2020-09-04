
node {
    uint8_t prev = 0;

    uint8_t crc8(XString str) {
        uint8_t result = 0;
        auto it = str.iterate();

        for (; it; ++it) {
            result ^= *it;

            for (size_t i = 0; i < 8; i++) {
                if (result & 0x80) {
                    result <<= 1;
                    result ^= 0x85; // x8 + x7 + x2 + x0
                } else {
                    result <<= 1;
                }
            }
        }

        return result;
    }

    void evaluate(Context ctx) {
        auto str = getValue<input_IN>(ctx);

        uint8_t current = crc8(str);

        if (!isSettingUp() && current != prev)
            emitValue<output_OUT>(ctx, 1);

        prev = current;
    }
};
