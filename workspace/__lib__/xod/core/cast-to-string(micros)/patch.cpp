
#pragma XOD dirtieness disable

node {
    void uint32ToCharArray(uint32_t value, char* str) {
        if (value == 0) {
            str[0] = '0';
            str[1] = '\0';
        }

        uint8_t idx = 0;
        uint8_t len = 0;

        auto v = value;
        while (v > 0) {
            len++;
            v = v / 10;
        }
        v = value;
        while (v > 0) {
            auto q = v % 10;
            v = (v - q) / 10;
            str[len - idx - 1] = '0' + q;
            idx++;
        }
        str[len] = '\0';
    }

    char str[11];
    CStringView view = CStringView(str);

    void evaluate(Context ctx) {
        auto micros = getValue<input_IN>(ctx);
        uint32ToCharArray(micros, str);
        emitValue<output_OUT>(ctx, XString(&view));
    }
}
